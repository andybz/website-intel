// Deterministic MVP severity rules per README section 21. This is intentionally
// simple - the real "Website Impact Score" (section 20) is a later phase.
const BASE_SEVERITY: Record<string, number> = {
	php_notice: 1,
	php_warning: 3,
	php_fatal: 7,
	http_404: 1,
	http_500: 6,
	failed_login: 2
};

const DEFAULT_SEVERITY = 3;

export function getBaseSeverity(eventType: string): number {
	return BASE_SEVERITY[eventType] ?? DEFAULT_SEVERITY;
}

// Nudges severity up with occurrence count, capped at 10. Deliberately mild -
// this is a placeholder heuristic, not the real impact score engine.
export function computeCurrentSeverity(baseSeverity: number, occurrenceCount: number): number {
	const bump = Math.floor(Math.log10(Math.max(occurrenceCount, 1) + 1));
	return Math.min(10, baseSeverity + bump);
}
