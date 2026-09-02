import { z } from 'zod';
import { json, error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sites, issues } from '$db/schema';
import { verifyApiSecret } from '$lib/server/site-auth';
import { computeFingerprint, normalizeMessage } from '$lib/server/fingerprint';
import { getBaseSeverity } from '$lib/server/severity';
import { sanitizeMetadata, sanitizeRequestUrl } from '$lib/server/sanitize';

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

function defaultCategory(eventType: string): string {
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
	const message = normalizeMessage(data.message);
	const fingerprint = computeFingerprint({
		eventType: data.eventType,
		message: data.message,
		file: data.file,
		line: data.line
	});

	const now = new Date();

	const [issue] = await db
		.insert(issues)
		.values({
			siteId: site.id,
			fingerprint,
			eventType: data.eventType,
			category: data.category ?? defaultCategory(data.eventType),
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
		.onConflictDoUpdate({
			target: [issues.siteId, issues.fingerprint],
			set: {
				occurrenceCount: sql`${issues.occurrenceCount} + 1`,
				lastSeen: now,
				updatedAt: now,
				status: 'open',
				// Keep the most recent technical details for debugging context.
				stackTrace: data.stackTrace ?? sql`${issues.stackTrace}`,
				requestUrl: data.requestUrl ? sanitizeRequestUrl(data.requestUrl) : sql`${issues.requestUrl}`
			}
		})
		.returning();

	return json({ ok: true, issueId: issue.id, occurrenceCount: issue.occurrenceCount });
};
