import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$db/schema';
import { createPasswordResetToken } from '$lib/server/password-reset';
import { sendEmail } from '$lib/server/email';
import { isRateLimited, recordAttempt } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, url, getClientAddress }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, { error: 'Enter your email address.', email });
		}

		const rateLimitKey = `forgot-password:${getClientAddress()}`;
		if (isRateLimited(rateLimitKey)) {
			return fail(429, { error: 'Too many attempts. Try again later.', email });
		}
		recordAttempt(rateLimitKey);

		const [user] = await db.select().from(users).where(eq(users.email, email));

		// Always behave identically whether or not the account exists, to
		// avoid leaking which emails have accounts.
		if (user) {
			const token = await createPasswordResetToken(user.id);
			const resetUrl = `${url.origin}/reset-password/${token}`;

			try {
				await sendEmail({
					to: user.email,
					subject: 'Reset your Website Monitor password',
					text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
					html: `<p>Reset your password by clicking the link below:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>`
				});
			} catch (err) {
				console.error('Failed to send password reset email:', err);
			}
		}

		return { success: true };
	}
};
