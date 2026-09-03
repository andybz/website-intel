import { z } from 'zod';
import { json, error } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sites, issues, activity, issueHourlyCounts } from '$db/schema';
import { verifyApiSecret } from '$lib/server/site-auth';
import { computeFingerprint, normalizeMessage } from '$lib/server/fingerprint';
import { getBaseSeverity, computeCurrentSeverity, NOTIFICATION_SEVERITY_THRESHOLD } from '$lib/server/severity';
import { sanitizeMetadata, sanitizeRequestUrl } from '$lib/server/sanitize';
import { computeIssueStatus } from '$lib/utils/time';
import { notifyIssue } from '$lib/server/notify';

const eventSchema = z.object({
	eventType: z.string().trim().min(1).max(50),
	category: z.enum(['error', 'security', 'wordpress', 'change', 'performance', 'uptime', 'system']).optional(),
	message: z.string().trim().min(1).max(2000),
	file: z.string().trim().max(500).optional(),
	line: z.number().int().min(0).max(1_000_000).optional(),
	stackTrace: z.string().trim().max(5000).optional(),
	requestUrl: z.string().trim().max(2000).optional(),
	metadata: z.record(z.string(), z.unknown()).optional()
});

function getBearerToken(request: Request): string | null {
	const header = request.headers.get('authorization') ?? '';
	const match = /^Bearer (.+)$/.exec(header);
	return match ? match[1] : null;
}

const CHANGE_EVENT_TYPES = new Set([
	'plugin_updated',
	'plugin_activated',
	'plugin_deactivated',
	'plugin_installed',
	'plugin_deleted',
	'theme_updated',
	'theme_activated',
	'wordpress_updated'
]);

function defaultCategory(eventType: string): string {
	if (CHANGE_EVENT_TYPES.has(eventType)) return 'change';
	if (eventType === 'failed_login' || eventType.startsWith('security_')) return 'security';
	if (eventType.startsWith('php_') || eventType.startsWith('http_')) return 'error';
	return 'system';
}

export const POST: RequestHandler = async ({ request, params }) => {
	const secret = getBearerToken(request);
	if (!secret) {
		error(401, 'Missing bearer credential.');
	}

	const [site] = await db.select().from(sites).where(eq(sites.uuid, params.uuid));
	if (!site || !site.apiSecretHash || !verifyApiSecret(site.apiSecretHash, secret)) {
		error(401, 'Invalid site credential.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body.');
	}

	const parsed = eventSchema.safeParse(body);
	if (!parsed.success) {
		error(400, 'Invalid event payload.');
	}

	const data = parsed.data;
	const category = data.category ?? defaultCategory(data.eventType);
	const now = new Date();

	// Discrete one-off facts (a plugin update, an activation, etc.) get their
	// own timeline row - they should never be deduped/grouped like errors.
	if (category === 'change') {
		const [entry] = await db
			.insert(activity)
			.values({
				siteId: site.id,
				eventType: data.eventType,
				category,
				message: data.message.slice(0, 2000),
				metadata: data.metadata ? sanitizeMetadata(data.metadata) : null,
				occurredAt: now
			})
			.returning();

		return json({ ok: true, activityId: entry.id });
	}

	const message = normalizeMessage(data.message);
	const fingerprint = computeFingerprint({
		eventType: data.eventType,
		message: data.message,
		file: data.file,
		line: data.line
	});

	const [existing] = await db
		.select()
		.from(issues)
		.where(and(eq(issues.siteId, site.id), eq(issues.fingerprint, fingerprint)));

	// A resolved issue reoccurring is treated as a fresh detection, so it can
	// trigger a notification again rather than staying silenced forever.
	const wasResolved = existing ? computeIssueStatus(existing.status, existing.lastSeen) === 'resolved' : false;

	let issue;
	if (existing) {
		[issue] = await db
			.update(issues)
			.set({
				occurrenceCount: sql`${issues.occurrenceCount} + 1`,
				lastSeen: now,
				updatedAt: now,
				status: 'open',
				notifiedAt: wasResolved ? null : sql`${issues.notifiedAt}`,
				// Keep the most recent technical details for debugging context
				// (e.g. the latest attempted username/IP for a failed_login issue).
				stackTrace: data.stackTrace ?? sql`${issues.stackTrace}`,
				requestUrl: data.requestUrl ? sanitizeRequestUrl(data.requestUrl) : sql`${issues.requestUrl}`,
				metadata: data.metadata ? sanitizeMetadata(data.metadata) : sql`${issues.metadata}`
			})
			.where(eq(issues.id, existing.id))
			.returning();
	} else {
		[issue] = await db
			.insert(issues)
			.values({
				siteId: site.id,
				fingerprint,
				eventType: data.eventType,
				category,
				severity: getBaseSeverity(data.eventType),
				message,
				file: data.file ?? null,
				line: data.line ?? null,
				stackTrace: data.stackTrace ?? null,
				requestUrl: data.requestUrl ? sanitizeRequestUrl(data.requestUrl) : null,
				metadata: data.metadata ? sanitizeMetadata(data.metadata) : null,
				occurrenceCount: 1,
				firstSeen: now,
				lastSeen: now,
				updatedAt: now
			})
			.returning();
	}

	// Hourly rollup for occurrence-over-time charts (README section 50).
	const hourStart = new Date(now);
	hourStart.setMinutes(0, 0, 0);
	await db
		.insert(issueHourlyCounts)
		.values({ issueId: issue.id, hourStart, count: 1 })
		.onConflictDoUpdate({
			target: [issueHourlyCounts.issueId, issueHourlyCounts.hourStart],
			set: { count: sql`${issueHourlyCounts.count} + 1` }
		});

	const currentSeverity = computeCurrentSeverity(issue.severity, issue.occurrenceCount);

	if (currentSeverity >= NOTIFICATION_SEVERITY_THRESHOLD && !issue.notifiedAt) {
		try {
			await notifyIssue(issue, site, currentSeverity);
			await db.update(issues).set({ notifiedAt: new Date() }).where(eq(issues.id, issue.id));
		} catch (err) {
			console.error('Failed to send issue notification email:', err);
		}
	}

	return json({ ok: true, issueId: issue.id, occurrenceCount: issue.occurrenceCount });
};
