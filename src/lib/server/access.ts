import { eq, and, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { siteUsers, sites, type Site } from '$db/schema';
import type { SessionUser } from '$lib/server/auth';

// 'admin' can see/manage every site. 'client' is restricted to whatever's
// been explicitly granted via site_users - view-only, enforced both at the
// site layout's load (viewing) and independently on every write action
// (SvelteKit actions don't re-run parent load functions).
export async function accessibleSiteIds(user: Pick<SessionUser, 'id' | 'role'>): Promise<number[] | 'all'> {
	if (user.role === 'admin') return 'all';
	const rows = await db.select({ siteId: siteUsers.siteId }).from(siteUsers).where(eq(siteUsers.userId, user.id));
	return rows.map((r) => r.siteId);
}

export async function accessibleSites(user: Pick<SessionUser, 'id' | 'role'>): Promise<Site[]> {
	const ids = await accessibleSiteIds(user);
	if (ids === 'all') return db.select().from(sites);
	if (ids.length === 0) return [];
	return db.select().from(sites).where(inArray(sites.id, ids));
}

export async function canAccessSite(user: Pick<SessionUser, 'id' | 'role'>, siteId: number): Promise<boolean> {
	if (user.role === 'admin') return true;
	const [row] = await db
		.select()
		.from(siteUsers)
		.where(and(eq(siteUsers.userId, user.id), eq(siteUsers.siteId, siteId)));
	return !!row;
}
