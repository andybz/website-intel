import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionToken, invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const token = getSessionToken(event);

	if (token) {
		await invalidateSession(token);
		deleteSessionTokenCookie(event);
	}

	redirect(303, '/login');
};
