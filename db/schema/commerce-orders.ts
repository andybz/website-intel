import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { sites } from './sites';

// Rolling window of recent WooCommerce orders per site (report-and-upsert on
// every heartbeat, not a raw event log) - deliberately excludes customer PII
// (name/email/address), just enough to answer "when was the last order, what
// was it, how's the store trending" (README-style philosophy: minimal data).
export const commerceOrders = pgTable(
	'commerce_orders',
	{
		id: serial('id').primaryKey(),
		siteId: integer('site_id')
			.notNull()
			.references(() => sites.id, { onDelete: 'cascade' }),
		externalOrderId: text('external_order_id').notNull(),
		orderNumber: text('order_number'),
		status: text('status').notNull(),
		total: text('total').notNull(),
		currency: text('currency'),
		itemCount: integer('item_count'),
		placedAt: timestamp('placed_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique().on(table.siteId, table.externalOrderId)]
);

export type CommerceOrder = typeof commerceOrders.$inferSelect;
export type NewCommerceOrder = typeof commerceOrders.$inferInsert;
