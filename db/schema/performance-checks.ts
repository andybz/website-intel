import { pgTable, serial, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// Periodic synthetic page-load measurement (server-side loopback request, not
// real user/browser telemetry) - one row per check, roughly hourly (see the
// WP plugin's own throttling), so this doubles as load-time history for the
// Performance tab's trend chart.
export const performanceChecks = pgTable('performance_checks', {
	id: serial('id').primaryKey(),
	siteId: integer('site_id')
		.notNull()
		.references(() => sites.id, { onDelete: 'cascade' }),
	loadTimeMs: integer('load_time_ms').notNull(),
	pageSizeBytes: integer('page_size_bytes'),
	// Array of { url, type, sizeBytes } for the largest assets found on the
	// homepage at check time - see src/lib/utils/performance.ts for the shape.
	assets: jsonb('assets'),
	checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow()
});

export type PerformanceCheck = typeof performanceChecks.$inferSelect;
export type NewPerformanceCheck = typeof performanceChecks.$inferInsert;
