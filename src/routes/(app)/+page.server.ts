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
			siteId: issues.siteId,
			severity: issues.severity,
			occurrenceCount: issues.occurrenceCount
		})
		.from(issues)
		.where(and(ne(issues.status, 'resolved'), gt(issues.lastSeen, new Date(Date.now() - OPEN_ISSUE_WINDOW_MS))));

	const severitiesBySite = new Map<number, number[]>();
	for (const issue of openIssues) {
		const currentSeverity = computeCurrentSeverity(issue.severity, issue.occurrenceCount);
		const list = severitiesBySite.get(issue.siteId) ?? [];
		list.push(currentSeverity);
		severitiesBySite.set(issue.siteId, list);
	}

	const sitesWithHealth = allSites.map((site) => ({
		...site,
		health:
			site.status === 'connected'
				? computeSiteHealth(severitiesBySite.get(site.id) ?? [])
				: null
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
