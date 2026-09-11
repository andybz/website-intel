import { and, gte, eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { performanceChecks } from '$db/schema';
import type { PerformanceAsset } from '$lib/utils/performance';

const WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

export const load: PageServerLoad = async ({ parent }) => {
	const { site } = await parent();

	const since = new Date(Date.now() - WINDOW_MS);

	const checks = await db
		.select()
		.from(performanceChecks)
		.where(and(eq(performanceChecks.siteId, site.id), gte(performanceChecks.checkedAt, since)))
		.orderBy(desc(performanceChecks.checkedAt));

	if (checks.length === 0) {
		return { site, hasData: false as const };
	}

	const latest = checks[0];
	const assets = ((latest.assets as PerformanceAsset[] | null) ?? [])
		.slice()
		.sort((a, b) => b.sizeBytes - a.sizeBytes);

	// Oldest-first for a left-to-right trend chart.
	const history = checks
		.slice()
		.reverse()
		.map((check) => ({ checkedAt: check.checkedAt, loadTimeMs: check.loadTimeMs }));

	const avgLoadTimeMs = Math.round(checks.reduce((sum, c) => sum + c.loadTimeMs, 0) / checks.length);

	return {
		site,
		hasData: true as const,
		latest: {
			loadTimeMs: latest.loadTimeMs,
			pageSizeBytes: latest.pageSizeBytes,
			checkedAt: latest.checkedAt
		},
		avgLoadTimeMs,
		assets,
		history
	};
};
