const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
	['year', 1000 * 60 * 60 * 24 * 365],
	['month', 1000 * 60 * 60 * 24 * 30],
	['day', 1000 * 60 * 60 * 24],
	['hour', 1000 * 60 * 60],
	['minute', 1000 * 60],
	['second', 1000]
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelativeTime(date: Date | string | null | undefined): string {
	if (!date) return 'Never';

	const target = typeof date === 'string' ? new Date(date) : date;
	const diffMs = target.getTime() - Date.now();

	for (const [unit, ms] of UNITS) {
		if (Math.abs(diffMs) >= ms || unit === 'second') {
			return formatter.format(Math.round(diffMs / ms), unit);
		}
	}

	return formatter.format(0, 'second');
}

// Heartbeats are expected roughly every 5 minutes, but WordPress's built-in
// pseudo-cron only fires on incoming page requests (it is NOT a true
// background scheduler) - on lower-traffic real sites this can lag well past
// the nominal interval even though the site is perfectly healthy. Use a
// generous threshold to avoid false "Connection lost" positives.
const STALE_THRESHOLD_MS = 1000 * 60 * 20;

export function isHeartbeatStale(lastHeartbeatAt: Date | string | null | undefined): boolean {
	if (!lastHeartbeatAt) return true;
	const target = typeof lastHeartbeatAt === 'string' ? new Date(lastHeartbeatAt) : lastHeartbeatAt;
	return Date.now() - target.getTime() > STALE_THRESHOLD_MS;
}

// An issue is considered resolved once this long has passed with no new
// occurrences (README section 29). Derived at read time - no background job
// needed, and any new occurrence flips it back to 'open' automatically
// (see the ingestion endpoint's onConflictDoUpdate).
const ISSUE_RESOLVED_AFTER_MS = 1000 * 60 * 30;

export function computeIssueStatus(
	status: string,
	lastSeen: Date | string
): 'open' | 'resolved' {
	if (status === 'resolved') return 'resolved';
	const target = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
	return Date.now() - target.getTime() > ISSUE_RESOLVED_AFTER_MS ? 'resolved' : 'open';
}
