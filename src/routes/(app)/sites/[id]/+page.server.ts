import { desc, eq, and, gte, gt, ne } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { issues, activity, pageviewHourlyCounts, sites } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeSiteHealth } from '$lib/server/health';
import { answerWebsiteQuestion } from '$lib/server/ask';
import { isRateLimited, recordAttempt } from '$lib/server/auth';

const TRAFFIC_WINDOW_MS = 1000 * 60 * 60 * 24;
const TREND_DAYS = 7;
const TREND_WINDOW_MS = 1000 * 60 * 60 * 24 * TREND_DAYS;

// Matches computeIssueStatus's resolve-after threshold (src/lib/utils/time.ts)
// - filtering at the query level (not a row-count limit) so a busy site can't
// have its worst open issues silently truncated out of the health score.
const OPEN_ISSUE_WINDOW_MS = 1000 * 60 * 30;

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const openIssueRows = await db
		.select()
		.from(issues)
		.where(
			and(
				eq(issues.siteId, site.id),
				ne(issues.status, 'resolved'),
				gt(issues.lastSeen, new Date(Date.now() - OPEN_ISSUE_WINDOW_MS))
			)
		)
		.orderBy(desc(issues.lastSeen));

	const openIssues = openIssueRows.map((issue) => ({
		...issue,
		currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount)
	}));

	// Only surface currently-open issues in the "worth knowing" summary -
	// resolved ones aren't worth a glance-level mention anymore.
	const topIssues = [...openIssues].sort((a, b) => b.currentSeverity - a.currentSeverity).slice(0, 3);

	const health = computeSiteHealth(openIssues.map((issue) => issue.currentSeverity));

	// "Today's Snapshot" (README section 15) - rolling 24h window, not calendar day.
	const trafficRows = await db
		.select()
		.from(pageviewHourlyCounts)
		.where(
			and(
				eq(pageviewHourlyCounts.siteId, site.id),
				gte(pageviewHourlyCounts.hourStart, new Date(Date.now() - TRAFFIC_WINDOW_MS))
			)
		);

	const traffic = {
		humans: trafficRows.filter((r) => r.classification === 'human').reduce((sum, r) => sum + r.count, 0),
		bots: trafficRows.filter((r) => r.classification !== 'human').reduce((sum, r) => sum + r.count, 0)
	};

	// 7-day human vs. bot trend for the Overview hero chart - same gap-filled
	// daily bucketing approach as the Traffic tab, so the two stay consistent.
	const trendRows = await db
		.select()
		.from(pageviewHourlyCounts)
		.where(
			and(
				eq(pageviewHourlyCounts.siteId, site.id),
				gte(pageviewHourlyCounts.hourStart, new Date(Date.now() - TREND_WINDOW_MS))
			)
		);

	const trafficTrend: { label: string; humans: number; bots: number }[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	for (let i = TREND_DAYS - 1; i >= 0; i--) {
		const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
		const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
		const dayRows = trendRows.filter((r) => r.hourStart >= dayStart && r.hourStart < dayEnd);
		trafficTrend.push({
			label: dayStart.toLocaleDateString([], { weekday: 'short' }),
			humans: dayRows.filter((r) => r.classification === 'human').reduce((sum, r) => sum + r.count, 0),
			bots: dayRows.filter((r) => r.classification !== 'human').reduce((sum, r) => sum + r.count, 0)
		});
	}

	return {
		site,
		topIssues,
		issueCount: openIssues.length,
		health,
		traffic,
		trafficTrend,
		criticalCount: openIssues.filter((issue) => issue.currentSeverity >= 8).length
	};
};

const ASK_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

export const actions: Actions = {
	// "Ask Your Website" (README section 31) - grounded strictly in structured
	// data gathered here, never raw DB access from the model's side.
	ask: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not signed in.' });

		const rateLimitKey = `ask:${locals.user.id}`;
		if (isRateLimited(rateLimitKey)) {
			return fail(429, { error: 'Too many questions. Try again in a few minutes.' });
		}

		const data = await request.formData();
		const question = String(data.get('question') ?? '').trim();
		if (!question || question.length > 300) {
			return fail(400, { error: 'Ask a question up to 300 characters.' });
		}

		const siteId = Number(params.id);
		const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
		if (!site) return fail(404, { error: 'Website not found.' });

		recordAttempt(rateLimitKey);

		const openIssueRows = await db
			.select()
			.from(issues)
			.where(
				and(
					eq(issues.siteId, siteId),
					ne(issues.status, 'resolved'),
					gt(issues.lastSeen, new Date(Date.now() - OPEN_ISSUE_WINDOW_MS))
				)
			)
			.orderBy(desc(issues.lastSeen));
		const openIssuesAll = openIssueRows.map((issue) => ({
			...issue,
			currentSeverity: computeCurrentSeverity(issue.severity, issue.occurrenceCount)
		}));

		const health = computeSiteHealth(openIssuesAll.map((issue) => issue.currentSeverity));

		// Cap what's sent to the AI model's context, after health is already scored
		// from the full open set - keeps the score accurate regardless of prompt size.
		const openIssues = [...openIssuesAll].sort((a, b) => b.currentSeverity - a.currentSeverity).slice(0, 10);

		const recentActivityRows = await db
			.select()
			.from(activity)
			.where(eq(activity.siteId, siteId))
			.orderBy(desc(activity.occurredAt))
			.limit(10);

		const trafficRows = await db
			.select()
			.from(pageviewHourlyCounts)
			.where(
				and(
					eq(pageviewHourlyCounts.siteId, siteId),
					gte(pageviewHourlyCounts.hourStart, new Date(Date.now() - ASK_WINDOW_MS))
				)
			);

		const context = {
			site: { name: site.name, url: site.url, status: site.status, healthScore: health.score, healthGrade: health.grade },
			openIssues: openIssues.map((issue) => ({
				id: issue.id,
				message: issue.message,
				eventType: issue.eventType,
				severity: issue.currentSeverity,
				occurrenceCount: issue.occurrenceCount,
				firstSeen: issue.firstSeen.toISOString(),
				lastSeen: issue.lastSeen.toISOString()
			})),
			recentActivity: recentActivityRows.map((a) => ({ message: a.message, occurredAt: a.occurredAt.toISOString() })),
			traffic7d: {
				humans: trafficRows.filter((r) => r.classification === 'human').reduce((sum, r) => sum + r.count, 0),
				bots: trafficRows.filter((r) => r.classification !== 'human').reduce((sum, r) => sum + r.count, 0)
			}
		};

		try {
			const answer = await answerWebsiteQuestion(question, context);
			return { success: true, question, answer };
		} catch (err) {
			console.error('Failed to answer website question:', err);
			return fail(500, { error: 'Could not get an answer right now. Try again shortly.' });
		}
	}
};
