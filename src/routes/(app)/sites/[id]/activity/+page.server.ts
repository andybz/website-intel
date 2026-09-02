import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { activity } from '$db/schema';

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const entries = await db
		.select()
		.from(activity)
		.where(eq(activity.siteId, site.id))
		.orderBy(desc(activity.occurredAt))
		.limit(100);

	return { site, entries };
};
