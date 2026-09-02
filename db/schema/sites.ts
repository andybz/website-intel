import { pgTable, serial, uuid, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Lifecycle of a site's connection to the monitoring platform.
export const siteStatus = pgEnum('site_status', ['pending', 'connected', 'disconnected']);

export const sites = pgTable('sites', {
	id: serial('id').primaryKey(),
	uuid: uuid('uuid').notNull().defaultRandom().unique(),
	name: text('name').notNull(),
	url: text('url').notNull(),
	status: siteStatus('status').notNull().default('pending'),
	// Hash of the permanent API secret issued after pairing; never store the raw secret.
	apiSecretHash: text('api_secret_hash'),
	wordpressVersion: text('wordpress_version'),
	phpVersion: text('php_version'),
	serverSoftware: text('server_software'),
	activeTheme: text('active_theme'),
	themeVersion: text('theme_version'),
	isMultisite: boolean('is_multisite').notNull().default(false),
	connectedAt: timestamp('connected_at', { withTimezone: true }),
	lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
