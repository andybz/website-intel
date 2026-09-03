/**
 * Deterministic MVP "change correlation" (README section 24 "What Happened?"
 * timeline, simplified). No AI involved - just time-proximity: was there a
 * recent site change shortly before this issue first appeared? This is a
 * starting point; genuine AI-powered correlation/confidence scoring is a
 * later phase (see README backlog).
 */
const DEFAULT_WINDOW_MS = 1000 * 60 * 60; // 1 hour

export function findRelatedChange<T extends { occurredAt: Date }>(
	changes: T[],
	issueFirstSeen: Date,
	windowMs: number = DEFAULT_WINDOW_MS
): T | null {
	// Only changes that happened before (or at) the issue's first occurrence,
	// within the lookback window - a change AFTER the issue can't have caused it.
	const candidates = changes.filter(
		(change) =>
			change.occurredAt.getTime() <= issueFirstSeen.getTime() &&
			issueFirstSeen.getTime() - change.occurredAt.getTime() <= windowMs
	);

	if (candidates.length === 0) return null;

	// Closest-in-time candidate is the most plausible correlation.
	return candidates.reduce((closest, change) => (change.occurredAt > closest.occurredAt ? change : closest));
}
