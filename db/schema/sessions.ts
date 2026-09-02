import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// id is the SHA-256 hash (hex) of the session token; the raw token only ever lives in the cookie.
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
