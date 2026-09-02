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

// Heartbeats are expected roughly every 5 minutes; allow two missed beats
// before treating a "connected" site as stale in the UI.
const STALE_THRESHOLD_MS = 1000 * 60 * 10;

export function isHeartbeatStale(lastHeartbeatAt: Date | string | null | undefined): boolean {
	if (!lastHeartbeatAt) return true;
	const target = typeof lastHeartbeatAt === 'string' ? new Date(lastHeartbeatAt) : lastHeartbeatAt;
	return Date.now() - target.getTime() > STALE_THRESHOLD_MS;
}
