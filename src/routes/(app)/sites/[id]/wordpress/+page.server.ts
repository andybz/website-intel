import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sitePlugins } from '$db/schema';

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();
	const plugins = await db.select().from(sitePlugins).where(eq(sitePlugins.siteId, site.id));
	return { site, plugins };
};
