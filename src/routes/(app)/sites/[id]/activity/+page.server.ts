import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { activity, issues } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';

// A unified "What Happened" feed (README sections 24-25): site changes and
// issue detections merged into one chronological timeline. Foundation for
// future AI correlation ("checkout failures began 5 minutes after the
// WooCommerce update") - not built yet, but the data now lives side by side.
export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const [changeEntries, issueEntries] = await Promise.all([
		db.select().from(activity).where(eq(activity.siteId, site.id)).orderBy(desc(activity.occurredAt)).limit(100),
		db.select().from(issues).where(eq(issues.siteId, site.id)).orderBy(desc(issues.firstSeen)).limit(100)
	]);

	const timeline = [
		...changeEntries.map((entry) => ({
			type: 'change' as const,
			occurredAt: entry.occurredAt,
			message: entry.message,
			eventType: entry.eventType
		})),
		...issueEntries.map((issue) => ({
			type: 'issue' as const,
			occurredAt: issue.firstSeen,
			message: issue.message,
			eventType: issue.eventType,
			issueId: issue.id,
			severity: computeCurrentSeverity(issue.severity, issue.occurrenceCount)
		}))
	].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

	return { site, timeline };
};
