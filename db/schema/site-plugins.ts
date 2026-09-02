import { pgTable, serial, integer, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { sites } from './sites';

export const sitePlugins = pgTable(
	'site_plugins',
	{
		id: serial('id').primaryKey(),
		siteId: integer('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		version: text('version'),
		isActive: boolean('is_active').notNull().default(false),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.siteId, table.slug)]
);

export type SitePlugin = typeof sitePlugins.$inferSelect;
export type NewSitePlugin = typeof sitePlugins.$inferInsert;
