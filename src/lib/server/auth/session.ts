import { randomBytes, createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users, type Session, type User } from '$db/schema';

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // renew once under 15 days left

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

export function generateSessionToken(): string {
	return randomBytes(20).toString('base64url');
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const [session] = await db
		.insert(sessions)
		.values({
			id: hashToken(token),
			userId,
			expiresAt: new Date(Date.now() + SESSION_DURATION_MS)
		})
		.returning();
	return session;
}

export async function validateSessionToken(
	token: string
): Promise<{ session: Session; user: SessionUser } | { session: null; user: null }> {
	const sessionId = hashToken(token);
	const [result] = await db
		.select({
			session: sessions,
			user: { id: users.id, email: users.email, name: users.name, role: users.role }
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - SESSION_RENEW_THRESHOLD_MS) {
		session.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db.update(sessions).set({ expiresAt: session.expiresAt }).where(eq(sessions.id, sessionId));
	}

	return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export function getSessionToken(event: RequestEvent): string | undefined {
	return event.cookies.get(SESSION_COOKIE_NAME);
}
