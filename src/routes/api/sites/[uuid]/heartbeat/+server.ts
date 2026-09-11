import { z } from 'zod';
import { json, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sites, sitePlugins, commerceOrders } from '$db/schema';
import { verifyApiSecret } from '$lib/server/site-auth';
import { maybeRunRetentionCleanup } from '$lib/server/retention';

const pluginSchema = z.object({
	slug: z.string().trim().min(1).max(255),
	name: z.string().trim().min(1).max(255),
	version: z.string().trim().max(50).nullable().optional(),
	isActive: z.boolean().optional().default(false)
});

// Deliberately no customer PII (name/email/address) - just enough to answer
// "when was the last order, what was it, how's the store trending".
const commerceOrderSchema = z.object({
	orderId: z.union([z.string(), z.number()]).transform(String),
	orderNumber: z.string().trim().max(100).optional(),
	status: z.string().trim().min(1).max(50),
	total: z.string().trim().max(50),
	currency: z.string().trim().max(10).optional(),
	itemCount: z.number().int().min(0).max(10_000).optional(),
	placedAt: z.string().trim().max(50).optional()
});

const commerceSchema = z
	.object({
		platform: z.string().trim().min(1).max(50),
		productCount: z.number().int().min(0).max(10_000_000).optional(),
		currency: z.string().trim().max(10).optional(),
		recentOrders: z.array(commerceOrderSchema).max(50).optional()
	})
	.nullable();

const heartbeatSchema = z.object({
	wordpressVersion: z.string().trim().max(50).optional(),
	phpVersion: z.string().trim().max(50).optional(),
	serverSoftware: z.string().trim().max(255).optional(),
	activeTheme: z.string().trim().max(255).optional(),
	themeVersion: z.string().trim().max(50).optional(),
	isMultisite: z.boolean().optional(),
	plugins: z.array(pluginSchema).max(1000).optional(),
	commerce: commerceSchema.optional()
});

function getBearerToken(request: Request): string | null {
	const header = request.headers.get('authorization') ?? '';
	const match = /^Bearer (.+)$/.exec(header);
	return match ? match[1] : null;
}

export const POST: RequestHandler = async ({ request, params }) => {
	const secret = getBearerToken(request);
	if (!secret) {
		error(401, 'Missing bearer credential.');
	}

	const [site] = await db.select().from(sites).where(eq(sites.uuid, params.uuid));
	if (!site || !site.apiSecretHash || !verifyApiSecret(site.apiSecretHash, secret)) {
		error(401, 'Invalid site credential.');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	const parsed = heartbeatSchema.safeParse(body);
	if (!parsed.success) {
		error(400, 'Invalid heartbeat payload.');
	}

	const data = parsed.data;
	const now = new Date();

	await db
		.update(sites)
		.set({
			lastHeartbeatAt: now,
			updatedAt: now,
			...(data.wordpressVersion !== undefined && { wordpressVersion: data.wordpressVersion }),
			...(data.phpVersion !== undefined && { phpVersion: data.phpVersion }),
			...(data.serverSoftware !== undefined && { serverSoftware: data.serverSoftware }),
			...(data.activeTheme !== undefined && { activeTheme: data.activeTheme }),
			...(data.themeVersion !== undefined && { themeVersion: data.themeVersion }),
			...(data.isMultisite !== undefined && { isMultisite: data.isMultisite }),
			// commerce is nullable (not just optional) - null explicitly means
			// "no e-commerce plugin detected", clearing any prior snapshot
			// (e.g. WooCommerce got deactivated since the last heartbeat).
			...(data.commerce !== undefined && {
				ecommercePlatform: data.commerce?.platform ?? null,
				productCount: data.commerce?.productCount ?? null,
				storeCurrency: data.commerce?.currency ?? null
			})
		})
		.where(eq(sites.id, site.id));

	if (data.plugins) {
		await db.delete(sitePlugins).where(eq(sitePlugins.siteId, site.id));
		if (data.plugins.length > 0) {
			await db.insert(sitePlugins).values(
				data.plugins.map((plugin) => ({
					siteId: site.id,
					slug: plugin.slug,
					name: plugin.name,
					version: plugin.version ?? null,
					isActive: plugin.isActive ?? false
				}))
			);
		}
	}

	if (data.commerce?.recentOrders && data.commerce.recentOrders.length > 0) {
		for (const order of data.commerce.recentOrders) {
			const placedAt = order.placedAt ? new Date(order.placedAt) : now;
			await db
				.insert(commerceOrders)
				.values({
					siteId: site.id,
					externalOrderId: order.orderId,
					orderNumber: order.orderNumber ?? null,
					status: order.status,
					total: order.total,
					currency: order.currency ?? null,
					itemCount: order.itemCount ?? null,
					placedAt: isNaN(placedAt.getTime()) ? now : placedAt,
					updatedAt: now
				})
				.onConflictDoUpdate({
					target: [commerceOrders.siteId, commerceOrders.externalOrderId],
					set: {
						orderNumber: order.orderNumber ?? null,
						status: order.status,
						total: order.total,
						currency: order.currency ?? null,
						itemCount: order.itemCount ?? null,
						updatedAt: now
					}
				});
		}
	}

	void maybeRunRetentionCleanup();

	return json({ ok: true, lastSeen: now.toISOString() });
};
