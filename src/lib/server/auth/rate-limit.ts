// Simple in-memory fixed-window limiter to slow down brute-force login attempts.
// Process-local only; fine for a single-instance MVP deployment.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string): boolean {
	const entry = attempts.get(key);
	if (!entry || Date.now() >= entry.resetAt) {
		return false;
	}
	return entry.count >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
	const entry = attempts.get(key);
	if (!entry || Date.now() >= entry.resetAt) {
		attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
		return;
	}
	entry.count += 1;
}

export function clearAttempts(key: string): void {
	attempts.delete(key);
}
