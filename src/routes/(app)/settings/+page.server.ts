import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, sessions, sites, siteUsers } from '$db/schema';
import {
	hashPassword,
	verifyPasswordHash,
	generateSessionToken,
	createSession,
	setSessionTokenCookie,
	isRateLimited,
	recordAttempt,
	clearAttempts
} from '$lib/server/auth';
import { createPasswordResetToken } from '$lib/server/password-reset';
import { sendEmail } from '$lib/server/email';

const MIN_PASSWORD_LENGTH = 8;
const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // a week - plenty of time to check email

export const load: PageServerLoad = async ({ locals }) => {
	const isAdmin = locals.user?.role === 'admin';

	// Non-admins only ever see their own row (for "Change your password") -
	// never the full user list or other clients' site assignments.
	if (!isAdmin) {
		return { users: [], allSites: [], isAdmin };
	}

	const [allUsers, allSites, allAssignments] = await Promise.all([
		db
			.select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
			.from(users)
			.orderBy(users.createdAt),
		db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(sites.name),
		db.select().from(siteUsers)
	]);

	const siteIdsByUser = new Map<number, number[]>();
	for (const row of allAssignments) {
		const list = siteIdsByUser.get(row.userId) ?? [];
		list.push(row.siteId);
		siteIdsByUser.set(row.userId, list);
	}

	const usersWithSites = allUsers.map((u) => ({ ...u, siteIds: siteIdsByUser.get(u.id) ?? [] }));

	return { users: usersWithSites, allSites, isAdmin };
};

export const actions: Actions = {
	addUser: async ({ request, locals, url }) => {
		if (locals.user?.role !== 'admin') return fail(403, { form: 'addUser', error: 'Not authorized.', name: '', email: '' });

		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const role = data.get('role') === 'admin' ? 'admin' : 'client';
		const siteIds = data
			.getAll('siteIds')
			.map((v) => Number(v))
			.filter((n) => Number.isInteger(n));

		if (!name || !email) {
			return fail(400, { form: 'addUser', error: 'Name and email are required.', name, email });
		}

		const [existing] = await db.select().from(users).where(eq(users.email, email));
		if (existing) {
			return fail(400, { form: 'addUser', error: 'A user with that email already exists.', name, email });
		}

		if (role === 'client' && siteIds.length === 0) {
			return fail(400, {
				form: 'addUser',
				error: 'Select at least one website this client can access.',
				name,
				email
			});
		}

		const [user] = await db.insert(users).values({ name, email, role }).returning();

		if (role === 'client' && siteIds.length > 0) {
			await db.insert(siteUsers).values(siteIds.map((siteId) => ({ siteId, userId: user.id })));
		}

		const grantedSites =
			role === 'client' && siteIds.length > 0
				? await db.select({ name: sites.name }).from(sites).where(inArray(sites.id, siteIds))
				: [];

		const token = await createPasswordResetToken(user.id, INVITE_TOKEN_TTL_MS);
		const setPasswordUrl = `${url.origin}/reset-password/${token}`;
		const siteList = grantedSites.map((s) => s.name).join(', ');

		try {
			await sendEmail({
				to: email,
				subject: 'You’ve been added to CauseTrail',
				text: `An account has been created for you on CauseTrail${siteList ? ` with access to: ${siteList}` : ''}.\n\nSet your password to get started: ${setPasswordUrl}\n\nThis link expires in 7 days. If it expires, use "Forgot password?" on the login page to get a new one.`,
				html: `<p>An account has been created for you on CauseTrail${siteList ? ` with access to: <strong>${siteList}</strong>` : ''}.</p><p>Set your password to get started:</p><p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p><p>This link expires in 7 days. If it expires, use "Forgot password?" on the login page to get a new one.</p>`
			});
		} catch (err) {
			console.error('Failed to send invite email:', err);
			return fail(500, {
				form: 'addUser',
				error: 'User was created, but the invite email failed to send. Ask them to use "Forgot password?" to set their password.',
				name,
				email
			});
		}

		return { form: 'addUser', success: true };
	},

	updateSiteAccess: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { form: 'updateSiteAccess', error: 'Not authorized.' });

		const data = await request.formData();
		const userId = Number(data.get('userId'));
		const siteIds = data
			.getAll('siteIds')
			.map((v) => Number(v))
			.filter((n) => Number.isInteger(n));

		if (!Number.isInteger(userId)) {
			return fail(400, { form: 'updateSiteAccess', error: 'Invalid request.' });
		}

		await db.delete(siteUsers).where(eq(siteUsers.userId, userId));
		if (siteIds.length > 0) {
			await db.insert(siteUsers).values(siteIds.map((siteId) => ({ siteId, userId })));
		}

		return { form: 'updateSiteAccess', success: true, userId };
	},

	changePassword: async (event) => {
		const { request, locals } = event;
		if (!locals.user) return fail(401, { form: 'changePassword', error: 'Not signed in.' });

		const rateLimitKey = `change-password:${locals.user.id}`;
		if (isRateLimited(rateLimitKey)) {
			return fail(429, { form: 'changePassword', error: 'Too many attempts. Try again later.' });
		}

		const data = await request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { form: 'changePassword', error: 'All fields are required.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { form: 'changePassword', error: 'New passwords do not match.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				form: 'changePassword',
				error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`
			});
		}

		const [user] = await db.select().from(users).where(eq(users.id, locals.user.id));
		const valid = user?.passwordHash && (await verifyPasswordHash(user.passwordHash, currentPassword));

		if (!valid) {
			recordAttempt(rateLimitKey);
			return fail(400, { form: 'changePassword', error: 'Current password is incorrect.' });
		}
		clearAttempts(rateLimitKey);

		const newHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, locals.user.id));

		// Invalidate every existing session for this user, then issue a fresh
		// one so the browser making this change stays signed in.
		await db.delete(sessions).where(eq(sessions.userId, locals.user.id));
		const token = generateSessionToken();
		const session = await createSession(token, locals.user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		return { form: 'changePassword', success: true };
	},

	resetPassword: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { form: 'resetPassword', error: 'Not authorized.' });

		const data = await request.formData();
		const userId = Number(data.get('userId'));
		const newPassword = String(data.get('newPassword') ?? '');

		if (!Number.isInteger(userId) || !newPassword) {
			return fail(400, { form: 'resetPassword', error: 'Invalid request.', userId });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				form: 'resetPassword',
				error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
				userId
			});
		}

		const newHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
		// Force that account to sign in again with the new password everywhere.
		await db.delete(sessions).where(eq(sessions.userId, userId));

		return { form: 'resetPassword', success: true, userId };
	},

	removeUser: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { form: 'removeUser', error: 'Not authorized.' });

		const data = await request.formData();
		const userId = Number(data.get('userId'));

		if (userId === locals.user.id) {
			return fail(400, { form: 'removeUser', error: 'You cannot remove your own account.' });
		}

		const allUsers = await db.select().from(users);
		if (allUsers.length <= 1) {
			return fail(400, { form: 'removeUser', error: 'Cannot remove the last remaining user.' });
		}

		await db.delete(users).where(eq(users.id, userId));

		return { form: 'removeUser', success: true };
	}
};
