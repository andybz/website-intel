import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
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
