import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// 'admin' sees/manages everything (all sites, user management). 'client' is
// restricted to whichever sites are granted via site_users, view-only.
export const userRole = pgEnum('user_role', ['admin', 'client']);

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	// Nullable: a newly-invited user has no password yet until they follow
	// the emailed "set your password" link (src/lib/server/password-reset.ts) -
	// the login flow already handles a null hash as "can never match".
	passwordHash: text('password_hash'),
	role: userRole('role').notNull().default('admin'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
