import { error, fail } from '@sveltejs/kit';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues, sites, issueHourlyCounts, activity } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeIssueStatus } from '$lib/utils/time';
import { generateIssueSummary } from '$lib/server/ai';
import { computeTrend } from '$lib/server/trend';
import { findRelatedChange } from '$lib/server/correlation';

const CHART_HOURS = 48;
const CORRELATION_WINDOW_MS = 1000 * 60 * 60;

export const load: PageServerLoad = async ({ parent, params }) => {
	const { site } = await parent();

	const issueId = Number(params.issueId);
	if (!Number.isInteger(issueId)) error(404, 'Issue not found');

	const [issue] = await db
		.select()
		.from(issues)
		.where(and(eq(issues.id, issueId), eq(issues.siteId, site.id)));

	if (!issue) error(404, 'Issue not found');

	const since = new Date(Date.now() - CHART_HOURS * 60 * 60 * 1000);
	const rows = await db
		.select()
		.from(issueHourlyCounts)
		.where(and(eq(issueHourlyCounts.issueId, issueId), gte(issueHourlyCounts.hourStart, since)));

	const countByHour = new Map(rows.map((r) => [r.hourStart.getTime(), r.count]));
	const chartBuckets = [];
	const now = new Date();
	now.setMinutes(0, 0, 0);
	for (let i = CHART_HOURS - 1; i >= 0; i--) {
		const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
		chartBuckets.push({
			label: hour.toLocaleTimeString([], { hour: 'numeric' }),
			count: countByHour.get(hour.getTime()) ?? 0
		});
	}

	const recentChanges = await db
		.select()
		.from(activity)
		.where(
			and(
				eq(activity.siteId, site.id),
				lte(activity.occurredAt, issue.firstSeen),
				gte(activity.occurredAt, new Date(issue.firstSeen.getTime() - CORRELATION_WINDOW_MS))
			)
		);
	const relatedChange = findRelatedChange(recentChanges, issue.firstSeen, CORRELATION_WINDOW_MS);

	return {
		site,
		issue: {
			...issue,
			currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount),
			displayStatus: computeIssueStatus(issue.status, issue.lastSeen)
		},
		chartBuckets,
		trend: computeTrend(chartBuckets),
		relatedChange
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
	},

	// Manual resolve - lets a user close an issue immediately instead of
	// waiting for the 30-min no-occurrence auto-resolve window (time.ts).
	// A new occurrence still flips it back to 'open' automatically.
	resolve: async ({ params }) => {
		const issueId = Number(params.issueId);
		if (!Number.isInteger(issueId)) return fail(404, { error: 'Issue not found.' });

		await db.update(issues).set({ status: 'resolved', updatedAt: new Date() }).where(eq(issues.id, issueId));

		return { success: true, resolved: true };
	}
};

