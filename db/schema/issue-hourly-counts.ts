import { pgTable, serial, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { issues } from './issues';

// Lightweight hourly rollup of occurrence counts per issue - enables "is this
// getting worse?" charts (README section 50) without storing every raw event
// forever (section 54's retention philosophy: aggregates, not raw logs).
export const issueHourlyCounts = pgTable(
	'issue_hourly_counts',
	{
		id: serial('id').primaryKey(),
		issueId: integer('issue_id')
			.notNull()
			.references(() => issues.id, { onDelete: 'cascade' }),
		hourStart: timestamp('hour_start', { withTimezone: true }).notNull(),
		count: integer('count').notNull().default(1)
	},
	(table) => [unique().on(table.issueId, table.hourStart)]
);

export type IssueHourlyCount = typeof issueHourlyCounts.$inferSelect;
export type NewIssueHourlyCount = typeof issueHourlyCounts.$inferInsert;
