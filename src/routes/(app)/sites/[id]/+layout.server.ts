import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sites } from '$db/schema';
import { canAccessSite } from '$lib/server/access';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const siteId = Number(params.id);
	if (!Number.isInteger(siteId)) error(404, 'Website not found');

	const [site] = await db.select().from(sites).where(eq(sites.id, siteId));
	if (!site) error(404, 'Website not found');

	// Not "not found" for a genuinely missing site vs. one this user just
	// can't see - deliberately the same 404 either way, so a client can't
	// probe which site IDs exist.
	if (!(await canAccessSite(locals.user!, siteId))) error(404, 'Website not found');

	return { site };
};
