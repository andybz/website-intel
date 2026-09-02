import { redirect, type Handle } from '@sveltejs/kit';
import {
	getSessionToken,
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
	const token = getSessionToken(event);

	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(token);

		if (session) {
			setSessionTokenCookie(event, token, session.expiresAt);
		} else {
			deleteSessionTokenCookie(event);
		}

		event.locals.user = user;
		event.locals.session = session;
	}

	const isPublicPath = PUBLIC_PATHS.has(event.url.pathname);

	if (!event.locals.user && !isPublicPath) {
		redirect(303, '/login');
	}

	if (event.locals.user && isPublicPath) {
		redirect(303, '/');
	}

	return resolve(event);
};
