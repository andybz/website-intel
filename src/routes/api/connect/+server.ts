import { z } from 'zod';
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sites, pairingTokens } from '$db/schema';
import { findValidPairingToken } from '$lib/server/pairing';
import { generateApiSecret, hashApiSecret } from '$lib/server/site-auth';
import { isRateLimited, recordAttempt, clearAttempts } from '$lib/server/auth';

const connectSchema = z.object({
	pairingToken: z.string().trim().min(1).max(64)
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const rateLimitKey = `connect:${getClientAddress()}`;
	if (isRateLimited(rateLimitKey)) {
		error(429, 'Too many attempts. Try again later.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body.');
	}

	const parsed = connectSchema.safeParse(body);
	if (!parsed.success) {
		error(400, 'pairingToken is required.');
	}

	const tokenRecord = await findValidPairingToken(parsed.data.pairingToken);

	if (!tokenRecord) {
		recordAttempt(rateLimitKey);
		error(401, 'Invalid or expired pairing key.');
	}

	clearAttempts(rateLimitKey);

	const [site] = await db.select().from(sites).where(eq(sites.id, tokenRecord.siteId));
	if (!site) {
		error(404, 'Website not found.');
	}

	const secret = generateApiSecret();

	await db
		.update(sites)
		.set({
			status: 'connected',
			apiSecretHash: hashApiSecret(secret),
			connectedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(sites.id, site.id));

	await db.update(pairingTokens).set({ usedAt: new Date() }).where(eq(pairingTokens.id, tokenRecord.id));

	return json({
		siteId: site.uuid,
		secret,
		heartbeatUrl: `/api/sites/${site.uuid}/heartbeat`
	});
};
