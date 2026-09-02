import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// Short-lived tokens used to pair a WordPress connector with a site record.
export const pairingTokens = pgTable('pairing_tokens', {
	id: serial('id').primaryKey(),
	siteId: integer('site_id')
		.notNull()
		.references(() => sites.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type PairingToken = typeof pairingTokens.$inferSelect;
export type NewPairingToken = typeof pairingTokens.$inferInsert;
