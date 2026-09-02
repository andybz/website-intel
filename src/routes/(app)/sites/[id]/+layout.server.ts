import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sites } from '$db/schema';

export const load: LayoutServerLoad = async ({ params }) => {
	const siteId = Number(params.id);
	if (!Number.isInteger(siteId)) error(404, 'Website not found');

	const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
	if (!site) error(404, 'Website not found');

	return { site };
};
