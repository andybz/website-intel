import { hash, verify } from '@node-rs/argon2';

// OWASP-recommended baseline parameters for argon2id.
const HASH_OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

export function hashPassword(password: string): Promise<string> {
	return hash(password, HASH_OPTIONS);
}

export function verifyPasswordHash(passwordHash: string, password: string): Promise<boolean> {
	return verify(passwordHash, password);
}
