import { createHash } from 'node:crypto';

// Collapses variable parts of a message (numbers, quoted strings) so that
// e.g. "Undefined array key 5" and "Undefined array key 12" group together,
// per README section 18 (avoid 10,000 identical errors as 10,000 issues).
export function normalizeMessage(message: string): string {
	return message
		.trim()
		.replace(/0x[0-9a-f]+/gi, '<hex>')
		.replace(/\b\d+\b/g, '<n>')
		.replace(/"[^"]*"/g, '"<s>"')
		.replace(/'[^']*'/g, "'<s>'")
		.slice(0, 500);
}

export function computeFingerprint(input: {
	eventType: string;
	message: string;
	file?: string | null;
	line?: number | null;
}): string {
	// Per README section 18: event_type + normalized_message + file + line.
	const parts = [input.eventType, normalizeMessage(input.message), input.file ?? '', input.line ?? ''];

	return createHash('sha256').update(parts.join('|')).digest('hex');
}
