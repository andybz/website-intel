/**
 * Deterministic trend classification (README section 29 "Increasing/Decreasing" lifecycle),
 * derived from hourly occurrence buckets already collected for the chart. No AI/ML involved.
 */
export type IssueTrend = 'increasing' | 'decreasing' | 'stable' | 'new';

const WINDOW_HOURS = 6;

export function computeTrend(buckets: { count: number }[]): IssueTrend {
	if (buckets.length < WINDOW_HOURS * 2) return 'stable';

	const recent = buckets.slice(-WINDOW_HOURS).reduce((sum, b) => sum + b.count, 0);
	const prior = buckets.slice(-WINDOW_HOURS * 2, -WINDOW_HOURS).reduce((sum, b) => sum + b.count, 0);

	if (prior === 0 && recent === 0) return 'stable';
	if (prior === 0 && recent > 0) return 'new';
	if (recent === 0 && prior > 0) return 'decreasing';

	const ratio = recent / prior;
	if (ratio >= 1.5) return 'increasing';
	if (ratio <= 0.5) return 'decreasing';
	return 'stable';
}
