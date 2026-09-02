import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from '$db/schema';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
}

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
