import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeIssueStatus } from '$lib/utils/time';
import { computeSiteHealth } from '$lib/server/health';

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const rows = await db
		.select()
		.from(issues)
		.where(eq(issues.siteId, site.id))
		.orderBy(desc(issues.lastSeen))
		.limit(20);

	const withStatus = rows.map((issue) => ({
		...issue,
		currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount),
		displayStatus: computeIssueStatus(issue.status, issue.lastSeen)
	}));

	const openIssues = withStatus.filter((issue) => issue.displayStatus === 'open');

	// Only surface currently-open issues in the "worth knowing" summary -
	// resolved ones aren't worth a glance-level mention anymore.
	const topIssues = openIssues.sort((a, b) => b.currentSeverity - a.currentSeverity).slice(0, 3);

	const health = computeSiteHealth(openIssues.map((issue) => issue.currentSeverity));

	return { site, topIssues, issueCount: rows.length, health };
};
