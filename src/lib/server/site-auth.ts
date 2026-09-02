import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// Permanent bearer credential issued to a site after pairing succeeds.
export function generateApiSecret(): string {
	return randomBytes(32).toString('base64url');
}

export function hashApiSecret(secret: string): string {
	return createHash('sha256').update(secret).digest('hex');
}

export function verifyApiSecret(storedHash: string, providedSecret: string): boolean {
	const providedHash = hashApiSecret(providedSecret);
	const stored = Buffer.from(storedHash, 'hex');
	const provided = Buffer.from(providedHash, 'hex');
	if (stored.length !== provided.length) return false;
	return timingSafeEqual(stored, provided);
}
