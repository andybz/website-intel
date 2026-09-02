/**
 * Deterministic MVP "Website Health" score (README sections 13/15/20 - a
 * simplified stand-in for the eventual full Website Impact Score, which
 * needs traffic/visitor-impact signals not yet collected; see README backlog).
 * Derived purely from currently-open issue severities, no AI involved.
 */
export type HealthStatus = 'healthy' | 'needs_attention' | 'critical';
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

function gradeForScore(score: number): HealthGrade {
	if (score >= 90) return 'A';
	if (score >= 80) return 'B';
	if (score >= 70) return 'C';
	if (score >= 60) return 'D';
	return 'F';
}

export function computeSiteHealth(openIssueSeverities: number[]): {
	score: number;
	status: HealthStatus;
	grade: HealthGrade;
} {
	if (openIssueSeverities.length === 0) {
		return { score: 100, status: 'healthy', grade: 'A' };
	}

	const worst = Math.max(...openIssueSeverities);
	// Quadratic severity penalty - a single severe issue should hurt far more
	// than several minor ones - plus a mild, capped penalty for having many
	// issues open at once (volume alone shouldn't be as damaging as one bad issue).
	const severityPenalty = worst * worst * 0.6;
	const volumePenalty = Math.min(8, (openIssueSeverities.length - 1) * 1);
	const score = Math.max(0, Math.round(100 - severityPenalty - volumePenalty));

	// Standard A-F grading bands: 90+ Healthy (A), 80-89 still Healthy but
	// only "somewhat" (B), 70-79 Needs Attention (C), below that is Critical.
	const status: HealthStatus = score >= 80 ? 'healthy' : score >= 70 ? 'needs_attention' : 'critical';

	return { score, status, grade: gradeForScore(score) };
}
