import { z } from 'zod';
import { json, error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sites, pageviewHourlyCounts } from '$db/schema';
import { verifyApiSecret } from '$lib/server/site-auth';
import { classifyUserAgent } from '$lib/server/traffic';

const pageviewSchema = z.object({
	userAgent: z.string().trim().max(500).optional()
});

function getBearerToken(request: Request): string | null {
	const header = request.headers.get('authorization') ?? '';
	const match = /^Bearer (.+)$/.exec(header);
	return match ? match[1] : null;
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

	const parsed = pageviewSchema.safeParse(body);
	if (!parsed.success) {
		error(400, 'Invalid pageview payload.');
	}

	const classification = classifyUserAgent(parsed.data.userAgent);

	const hourStart = new Date();
	hourStart.setMinutes(0, 0, 0);

	await db
		.insert(pageviewHourlyCounts)
		.values({ siteId: site.id, hourStart, classification, count: 1 })
		.onConflictDoUpdate({
			target: [pageviewHourlyCounts.siteId, pageviewHourlyCounts.hourStart, pageviewHourlyCounts.classification],
			set: { count: sql`${pageviewHourlyCounts.count} + 1` }
		});

	return json({ ok: true });
};
