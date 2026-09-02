// Aggressively strip anything that looks sensitive before it's ever stored.
// Per README section 53 - never store passwords, tokens, cookies, etc.
const SENSITIVE_KEY_PATTERN =
	/pass(word)?|authoriz|cookie|token|secret|api[_-]?key|credit[_-]?card|card[_-]?number|cvv/i;

const MAX_STRING_LENGTH = 2000;
const MAX_DEPTH = 4;

export function sanitizeMetadata(value: unknown, depth = 0): unknown {
	if (depth > MAX_DEPTH) return undefined;

	if (typeof value === 'string') {
		return value.slice(0, MAX_STRING_LENGTH);
	}

	if (Array.isArray(value)) {
		return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
	}

	if (value && typeof value === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			if (SENSITIVE_KEY_PATTERN.test(key)) continue;
			result[key] = sanitizeMetadata(val, depth + 1);
		}
		return result;
	}

	return value;
}

// Strips the query string from a request path - query params can carry
// sensitive values and README section 53 says to avoid storing them wholesale.
export function sanitizeRequestUrl(url: string): string {
	try {
		const parsed = new URL(url, 'http://placeholder.local');
		return parsed.pathname.slice(0, 500);
	} catch {
		return url.split('?')[0].slice(0, 500);
	}
}
