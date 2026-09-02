import { pgTable, serial, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// Discrete, one-off facts (plugin/theme/core updates, activations, etc.) -
// unlike `issues`, these are NOT grouped/deduped; each is its own timeline entry.
// Powers the Activity tab and, eventually, the "What Happened?" AI timeline
// (README sections 24-25).
export const activity = pgTable('activity', {
	id: serial('id').primaryKey(),
	siteId: integer('site_id')
		.notNull()
		.references(() => sites.id, { onDelete: 'cascade' }),
	eventType: text('event_type').notNull(),
	category: text('category').notNull().default('change'),
	message: text('message').notNull(),
	metadata: jsonb('metadata'),
	occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Activity = typeof activity.$inferSelect;
export type NewActivity = typeof activity.$inferInsert;
