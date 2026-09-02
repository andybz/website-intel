import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeIssueStatus } from '$lib/utils/time';

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const rows = await db
		.select()
		.from(issues)
		.where(eq(issues.siteId, site.id))
		.orderBy(desc(issues.lastSeen));

	const list = rows
		.map((issue) => ({
			...issue,
			currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount),
			displayStatus: computeIssueStatus(issue.status, issue.lastSeen)
		}))
		.sort((a, b) => {
			if (a.displayStatus !== b.displayStatus) return a.displayStatus === 'open' ? -1 : 1;
			return b.currentSeverity - a.currentSeverity;
		});

	return { site, issues: list };
};
