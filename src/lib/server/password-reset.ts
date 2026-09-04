import { randomBytes, createHash } from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { passwordResetTokens } from '$db/schema';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export function generatePasswordResetToken(): string {
	return randomBytes(32).toString('base64url');
}

function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId: number, ttlMs: number = RESET_TOKEN_TTL_MS) {
	const token = generatePasswordResetToken();
	await db.insert(passwordResetTokens).values({
		userId,
		tokenHash: hashResetToken(token),
		expiresAt: new Date(Date.now() + ttlMs)
	});
	return token;
}

export async function findValidPasswordResetToken(token: string) {
	const [record] = await db
		.select()
		.from(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, hashResetToken(token)),
				isNull(passwordResetTokens.usedAt),
				gt(passwordResetTokens.expiresAt, new Date())
			)
		);
	return record ?? null;
}

export async function markPasswordResetTokenUsed(id: number) {
	await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
}
