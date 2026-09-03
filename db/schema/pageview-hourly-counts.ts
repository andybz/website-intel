import { pgTable, serial, integer, timestamp, text, unique } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// Lightweight hourly rollup of classified pageviews (README sections 15/26/54)
// - never stores raw per-request logs, only aggregated counts per hour+classification.
export const pageviewHourlyCounts = pgTable(
	'pageview_hourly_counts',
	{
		id: serial('id').primaryKey(),
		siteId: integer('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		hourStart: timestamp('hour_start', { withTimezone: true }).notNull(),
		// See src/lib/server/traffic.ts TrafficClassification for the fixed set of values.
		classification: text('classification').notNull(),
		count: integer('count').notNull().default(1)
	},
	(table) => [unique().on(table.siteId, table.hourStart, table.classification)]
);

export type PageviewHourlyCount = typeof pageviewHourlyCounts.$inferSelect;
export type NewPageviewHourlyCount = typeof pageviewHourlyCounts.$inferInsert;
