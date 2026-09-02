/**
 * Deterministic MVP "Website Health" score (README sections 13/15/20 - a
 * simplified stand-in for the eventual full Website Impact Score, which
 * needs traffic/visitor-impact signals not yet collected; see README backlog).
 * Derived purely from currently-open issue severities, no AI involved.
 */
export type HealthStatus = 'healthy' | 'needs_attention' | 'critical';

export function computeSiteHealth(openIssueSeverities: number[]): {
	score: number;
	status: HealthStatus;
} {
	if (openIssueSeverities.length === 0) {
		return { score: 100, status: 'healthy' };
	}

	const worst = Math.max(...openIssueSeverities);
	const status: HealthStatus = worst >= 8 ? 'critical' : worst >= 5 ? 'needs_attention' : 'healthy';

	const severityPenalty = worst * 9;
	const volumePenalty = Math.min(10, (openIssueSeverities.length - 1) * 1.5);
	const score = Math.max(0, Math.round(100 - severityPenalty - volumePenalty));

	return { score, status };
}
