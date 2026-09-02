import { error, fail } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues, sites } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeIssueStatus } from '$lib/utils/time';
import { generateIssueSummary } from '$lib/server/ai';

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
			currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount),
			displayStatus: computeIssueStatus(issue.status, issue.lastSeen)
		}
	};
};

export const actions: Actions = {
	generateSummary: async ({ params }) => {
		const issueId = Number(params.issueId);
		if (!Number.isInteger(issueId)) return fail(404, { error: 'Issue not found.' });

		const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
		if (!issue) return fail(404, { error: 'Issue not found.' });

		const [site] = await db.select().from(sites).where(eq(sites.id, issue.siteId));
		if (!site) return fail(404, { error: 'Website not found.' });

		try {
			const summary = await generateIssueSummary(issue, site);
			await db
				.update(issues)
				.set({ aiSummary: summary, aiSummaryGeneratedAt: new Date() })
				.where(eq(issues.id, issueId));

			return { success: true };
		} catch (err) {
			console.error('Failed to generate AI issue summary:', err);
			return fail(500, { error: 'Could not generate an explanation right now. Try again shortly.' });
		}
	}
};

