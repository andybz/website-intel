import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sites } from '$db/schema';

export const load: PageServerLoad = async () => {
	const allSites = await db.select().from(sites);

	const summary = {
		total: allSites.length,
		connected: allSites.filter((site) => site.status === 'connected').length,
		pending: allSites.filter((site) => site.status === 'pending').length,
		disconnected: allSites.filter((site) => site.status === 'disconnected').length
	};

	return { sites: allSites, summary };
};
