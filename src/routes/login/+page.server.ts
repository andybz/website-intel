import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$db/schema';
import {
	verifyPasswordHash,
	generateSessionToken,
	createSession,
	setSessionTokenCookie,
	isRateLimited,
	recordAttempt,
	clearAttempts
} from '$lib/server/auth';

export const actions: Actions = {
	default: async (event) => {
		const { request, getClientAddress } = event;
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const rateLimitKey = `${getClientAddress()}:${email}`;
		if (isRateLimited(rateLimitKey)) {
			return fail(429, { error: 'Too many attempts. Try again later.', email });
		}

		const [user] = await db.select().from(users).where(eq(users.email, email));

		// Always run a hash verification, even for unknown emails, to avoid leaking
		// account existence via response timing.
		const passwordHash = user?.passwordHash ?? '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
		const validPassword = await verifyPasswordHash(passwordHash, password);

		if (!user || !validPassword) {
			recordAttempt(rateLimitKey);
			return fail(400, { error: 'Invalid email or password.', email });
		}

		clearAttempts(rateLimitKey);

		const token = generateSessionToken();
		const session = await createSession(token, user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		redirect(303, '/');
	}
};
