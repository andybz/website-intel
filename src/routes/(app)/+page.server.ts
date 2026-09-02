import type { Actions, PageServerLoad } from './$types';
import { eq, and, ne, gt } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sites, issues } from '$db/schema';
import { computeCurrentSeverity } from '$lib/server/severity';
import { computeSiteHealth } from '$lib/server/health';

const OPEN_ISSUE_WINDOW_MS = 1000 * 60 * 30;

export const load: PageServerLoad = async () => {
	const allSites = await db.select().from(sites);

	const openIssues = await db
		.select({
			id: issues.id,
			siteId: issues.siteId,
			severity: issues.severity,
			occurrenceCount: issues.occurrenceCount,
			message: issues.message,
			lastSeen: issues.lastSeen
		})
		.from(issues)
		.where(and(ne(issues.status, 'resolved'), gt(issues.lastSeen, new Date(Date.now() - OPEN_ISSUE_WINDOW_MS))));

	const severitiesBySite = new Map<number, number[]>();
	// Most-worth-knowing open issue per site, so the dashboard row can show it
	// inline instead of a separate cross-site section.
	const topIssueBySite = new Map<number, (typeof openIssues)[number] & { currentSeverity: number }>();
	for (const issue of openIssues) {
		const currentSeverity = computeCurrentSeverity(issue.severity, issue.occurrenceCount);

		const list = severitiesBySite.get(issue.siteId) ?? [];
		list.push(currentSeverity);
		severitiesBySite.set(issue.siteId, list);

		const current = topIssueBySite.get(issue.siteId);
		if (
			!current ||
			currentSeverity > current.currentSeverity ||
			(currentSeverity === current.currentSeverity && issue.lastSeen > current.lastSeen)
		) {
			topIssueBySite.set(issue.siteId, { ...issue, currentSeverity });
		}
	}

	const sitesWithHealth = allSites.map((site) => ({
		...site,
		health:
			site.status === 'connected'
				? computeSiteHealth(severitiesBySite.get(site.id) ?? [])
				: null,
		latestIssue: topIssueBySite.get(site.id) ?? null
	}));

	const summary = {
		total: allSites.length,
		connected: allSites.filter((site) => site.status === 'connected').length,
		pending: allSites.filter((site) => site.status === 'pending').length,
		disconnected: allSites.filter((site) => site.status === 'disconnected').length
	};

	return { sites: sitesWithHealth, summary };
};

export const actions: Actions = {
	remove: async ({ request }) => {
		const data = await request.formData();
		const siteId = Number(data.get('siteId'));
		if (Number.isInteger(siteId)) {
			await db.delete(sites).where(eq(sites.id, siteId));
		}
		redirect(303, '/');
	}
};
