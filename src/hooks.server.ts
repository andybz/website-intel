import { redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	getSessionToken,
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login', '/forgot-password']);

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

	const isPublicPath = PUBLIC_PATHS.has(event.url.pathname) || event.url.pathname.startsWith('/reset-password/');
	// /api/* routes authenticate WordPress connectors via their own bearer
	// credential (see src/lib/server/site-auth.ts), not the user session cookie.
	const isApiPath = event.url.pathname.startsWith('/api/');

	if (!event.locals.user && !isPublicPath && !isApiPath) {
		redirect(303, '/login');
	}

	if (event.locals.user && isPublicPath) {
		redirect(303, '/');
	}

	const response = await resolve(event);

	// README section 52 baseline security headers. This app holds highly
	// sensitive operational data about monitored sites, so treat it as a
	// core requirement rather than optional hardening.
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

	// CSP itself is configured via `kit.csp` in vite.config.ts, which lets
	// SvelteKit manage the nonce for its own inline hydration script - it's
	// applied automatically and shouldn't be set again here.
	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
	}

	return response;
};
