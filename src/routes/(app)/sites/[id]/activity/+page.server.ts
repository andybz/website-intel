import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { activity } from '$db/schema';

// Real site activity only (logins, user/account changes, content changes,
// plugin/theme/core changes) - deliberately NOT merged with the Issues
// pipeline anymore (that made this feel like a duplicate of the Issues tab).
// See src/routes/api/sites/[uuid]/events/+server.ts for the category routing.
export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const entries = await db
		.select()
		.from(activity)
		.where(eq(activity.siteId, site.id))
		.orderBy(desc(activity.occurredAt))
		.limit(200);

	return { site, timeline: entries };
};
