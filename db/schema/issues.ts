import { pgTable, serial, integer, text, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// A grouped problem (one fingerprint = one row), not a raw per-occurrence log.
// See src/lib/server/fingerprint.ts for how the fingerprint is derived.
export const issues = pgTable(
	'issues',
	{
		id: serial('id').primaryKey(),
		siteId: integer('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		fingerprint: text('fingerprint').notNull(),
		// Extensible on purpose - not a pg enum - see README section 16.
		eventType: text('event_type').notNull(),
		category: text('category').notNull().default('error'),
		// Deterministic base severity (0-10) per README section 21. Occurrence-based
		// escalation is computed at read time, not stored - see src/lib/server/severity.ts.
		severity: integer('severity').notNull(),
		message: text('message').notNull(),
		file: text('file'),
		line: integer('line'),
		stackTrace: text('stack_trace'),
		requestUrl: text('request_url'),
		occurrenceCount: integer('occurrence_count').notNull().default(1),
		status: text('status').notNull().default('open'), // open|resolved
		// Set when a notification email was last sent for this issue; reset to
		// null when a resolved issue reoccurs, so it can notify again.
		notifiedAt: timestamp('notified_at', { withTimezone: true }),
		// Cached AI explanation (README section 23) - generated on demand, not
		// automatically, to avoid unnecessary API cost. See src/lib/server/ai.ts.
		aiSummary: jsonb('ai_summary'),
		aiSummaryGeneratedAt: timestamp('ai_summary_generated_at', { withTimezone: true }),
		metadata: jsonb('metadata'),
		firstSeen: timestamp('first_seen', { withTimezone: true }).notNull().defaultNow(),
		lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.siteId, table.fingerprint)]
);

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
