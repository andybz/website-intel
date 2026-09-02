import { randomBytes, createHash } from 'node:crypto';
import { eq, gt, and, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pairingTokens } from '$db/schema';

const PAIRING_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Human-typeable pairing key, e.g. ABZ-3F9A2B7C1D4E5F6A
export function generatePairingToken(): string {
	const suffix = randomBytes(10).toString('hex').toUpperCase();
	return `ABZ-${suffix}`;
}

export function hashPairingToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createPairingToken(siteId: number) {
	const token = generatePairingToken();
	const [record] = await db
		.insert(pairingTokens)
		.values({
			siteId,
			tokenHash: hashPairingToken(token),
			expiresAt: new Date(Date.now() + PAIRING_TOKEN_TTL_MS)
		})
		.returning();

	return { token, record };
}

// Looks up an unused, unexpired pairing token by its raw value. Used by the
// WordPress connector's registration request (see Step 7).
export async function findValidPairingToken(token: string) {
	const [record] = await db
		.select()
		.from(pairingTokens)
		.where(
			and(
				eq(pairingTokens.tokenHash, hashPairingToken(token)),
				isNull(pairingTokens.usedAt),
				gt(pairingTokens.expiresAt, new Date())
			)
		);
	return record ?? null;
}
