import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$db/schema';
import { hashPassword } from '$lib/server/auth';
import { findValidPasswordResetToken, markPasswordResetTokenUsed } from '$lib/server/password-reset';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = async ({ params }) => {
	const tokenRecord = await findValidPasswordResetToken(params.token);
	return { valid: tokenRecord !== null };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const tokenRecord = await findValidPasswordResetToken(params.token);
		if (!tokenRecord) {
			return fail(400, { error: 'This reset link is invalid or has expired.' });
		}

		const data = await request.formData();
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (!newPassword || !confirmPassword) {
			return fail(400, { error: 'Both fields are required.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
		}

		const passwordHash = await hashPassword(newPassword);
		await db.update(users).set({ passwordHash }).where(eq(users.id, tokenRecord.userId));
		await db.delete(sessions).where(eq(sessions.userId, tokenRecord.userId));
		await markPasswordResetTokenUsed(tokenRecord.id);

		redirect(303, '/login');
	}
};
