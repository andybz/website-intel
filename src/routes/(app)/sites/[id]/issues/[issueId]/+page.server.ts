import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { site } = await parent();

	const issueId = Number(params.issueId);
	if (!Number.isInteger(issueId)) error(404, 'Issue not found');

	const [issue] = await db
		.select()
		.from(issues)
		.where(and(eq(issues.id, issueId), eq(issues.siteId, site.id)));

	if (!issue) error(404, 'Issue not found');

	return {
		site,
		issue: {
			...issue,
			currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount)
		}
	};
};
