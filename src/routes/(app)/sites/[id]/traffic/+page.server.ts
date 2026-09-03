import { eq, and, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { pageviewHourlyCounts } from '$db/schema';
import { TRAFFIC_CLASSIFICATION_LABELS, type TrafficClassification } from '$lib/server/traffic';

const DAYS = 7;
const WINDOW_MS = 1000 * 60 * 60 * 24 * DAYS;

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const rows = await db
		.select()
		.from(pageviewHourlyCounts)
		.where(
			and(eq(pageviewHourlyCounts.siteId, site.id), gte(pageviewHourlyCounts.hourStart, new Date(Date.now() - WINDOW_MS)))
		);

	// Daily human vs. bot trend, oldest to newest, gap-filled so every day shows even with zero traffic.
	const dayBuckets: { label: string; humans: number; bots: number }[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	for (let i = DAYS - 1; i >= 0; i--) {
		const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
		const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
		const dayRows = rows.filter((r) => r.hourStart >= dayStart && r.hourStart < dayEnd);
		dayBuckets.push({
			label: dayStart.toLocaleDateString([], { weekday: 'short' }),
			humans: dayRows.filter((r) => r.classification === 'human').reduce((sum, r) => sum + r.count, 0),
			bots: dayRows.filter((r) => r.classification !== 'human').reduce((sum, r) => sum + r.count, 0)
		});
	}

	// Breakdown by classification across the whole window, for the "By Type" list.
	const totalsByType = new Map<string, number>();
	for (const row of rows) {
		totalsByType.set(row.classification, (totalsByType.get(row.classification) ?? 0) + row.count);
	}
	const totalPageviews = [...totalsByType.values()].reduce((sum, n) => sum + n, 0);
	const breakdown = [...totalsByType.entries()]
		.map(([classification, count]) => ({
			classification: classification as TrafficClassification,
			label: TRAFFIC_CLASSIFICATION_LABELS[classification as TrafficClassification] ?? classification,
			count,
			percentage: totalPageviews > 0 ? Math.round((count / totalPageviews) * 100) : 0
		}))
		.sort((a, b) => b.count - a.count);

	return { site, dayBuckets, breakdown, totalPageviews };
};
