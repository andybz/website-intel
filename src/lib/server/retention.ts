import { lt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { issueHourlyCounts, pageviewHourlyCounts, sessions, pairingTokens, passwordResetTokens } from '$db/schema';

// README section 54: hourly aggregates should only be kept for ~1 year, and
// the app should never require unbounded raw-event storage. There's no cron
// infrastructure in this app, so this runs opportunistically (see below)
// rather than on a schedule.
const HOURLY_RETENTION_MS = 1000 * 60 * 60 * 24 * 365;

export async function pruneOldData() {
	const now = new Date();
	const oneYearAgo = new Date(now.getTime() - HOURLY_RETENTION_MS);

	const [droppedIssueHours, droppedPageviewHours, droppedSessions, droppedPairingTokens, droppedResetTokens] =
		await Promise.all([
			db.delete(issueHourlyCounts).where(lt(issueHourlyCounts.hourStart, oneYearAgo)).returning({ id: issueHourlyCounts.id }),
			db
				.delete(pageviewHourlyCounts)
				.where(lt(pageviewHourlyCounts.hourStart, oneYearAgo))
				.returning({ id: pageviewHourlyCounts.id }),
			// Expired sessions/tokens have zero value once past expiry - no grace
			// period needed, they're already rejected by validation logic anyway.
			db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id }),
			db.delete(pairingTokens).where(lt(pairingTokens.expiresAt, now)).returning({ id: pairingTokens.id }),
			db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now)).returning({ id: passwordResetTokens.id })
		]);

	return {
		issueHourlyCounts: droppedIssueHours.length,
		pageviewHourlyCounts: droppedPageviewHours.length,
		sessions: droppedSessions.length,
		pairingTokens: droppedPairingTokens.length,
		passwordResetTokens: droppedResetTokens.length
	};
}

// Triggered opportunistically from busy ingestion endpoints rather than a
// real scheduler (none exists in this app) - low probability so it only runs
// occasionally, mirroring the WP plugin's own opportunistic-heartbeat pattern.
const TRIGGER_PROBABILITY = 1 / 500;

export async function maybeRunRetentionCleanup(): Promise<void> {
	if (Math.random() > TRIGGER_PROBABILITY) return;

	try {
		const result = await pruneOldData();
		const totalDeleted = Object.values(result).reduce((sum, n) => sum + n, 0);
		if (totalDeleted > 0) {
			console.log('[retention] cleanup:', result);
		}
	} catch (err) {
		console.error('[retention] cleanup failed:', err);
	}
}
