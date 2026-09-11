import { desc, eq, and, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { commerceOrders } from '$db/schema';
import { REVENUE_STATUSES } from '$lib/utils/commerce';

const WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	if (!site.ecommercePlatform) {
		return { site, hasStore: false as const };
	}

	const since = new Date(Date.now() - WINDOW_MS);

	const [recentOrders, last7DaysOrders] = await Promise.all([
		db
			.select()
			.from(commerceOrders)
			.where(eq(commerceOrders.siteId, site.id))
			.orderBy(desc(commerceOrders.placedAt))
			.limit(20),
		db
			.select()
			.from(commerceOrders)
			.where(and(eq(commerceOrders.siteId, site.id), gte(commerceOrders.placedAt, since)))
	]);

	const revenueLast7Days = last7DaysOrders
		.filter((o) => REVENUE_STATUSES.includes(o.status))
		.reduce((sum, o) => sum + (Number.parseFloat(o.total) || 0), 0);

	return {
		site,
		hasStore: true as const,
		recentOrders,
		ordersLast7Days: last7DaysOrders.length,
		revenueLast7Days
	};
};
