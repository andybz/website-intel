import { pgTable, serial, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { sites } from './sites';
import { users } from './users';

// Grants a 'client' role user view access to a specific site. Irrelevant for
// 'admin' users, who can already see every site regardless of this table.
export const siteUsers = pgTable(
	'site_users',
	{
		id: serial('id').primaryKey(),
		siteId: integer('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.siteId, table.userId)]
);

export type SiteUser = typeof siteUsers.$inferSelect;
export type NewSiteUser = typeof siteUsers.$inferInsert;
