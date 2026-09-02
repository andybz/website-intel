import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$db/schema';
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

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = async () => {
	const allUsers = await db
		.select({ id: users.id, email: users.email, createdAt: users.createdAt })
		.from(users)
		.orderBy(users.createdAt);

	return { users: allUsers };
};

export const actions: Actions = {
	addUser: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { form: 'addUser', error: 'Email and password are required.', email });
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				form: 'addUser',
				error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
				email
			});
		}

		const [existing] = await db.select().from(users).where(eq(users.email, email));
		if (existing) {
			return fail(400, { form: 'addUser', error: 'A user with that email already exists.', email });
		}

		const passwordHash = await hashPassword(password);
		await db.insert(users).values({ email, passwordHash });

		return { form: 'addUser', success: true };
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
		const valid = user && (await verifyPasswordHash(user.passwordHash, currentPassword));

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
		if (!locals.user) return fail(401, { form: 'resetPassword', error: 'Not signed in.' });

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
		if (!locals.user) return fail(401, { form: 'removeUser', error: 'Not signed in.' });

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
