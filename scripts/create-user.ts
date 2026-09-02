// One-off script to create the initial (or an additional) private user.
// Usage: npm run db:create-user -- <email> <password>
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import * as schema from '../db/schema/index.ts';

const HASH_OPTIONS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

async function main() {
	const [, , email, password] = process.argv;

	if (!email || !password) {
		console.error('Usage: npm run db:create-user -- <email> <password>');
		process.exit(1);
	}

	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
	}

	const client = postgres(process.env.DATABASE_URL);
	const db = drizzle(client, { schema });

	const passwordHash = await hash(password, HASH_OPTIONS);
	const [user] = await db
		.insert(schema.users)
		.values({ email: email.trim().toLowerCase(), passwordHash })
		.returning({ id: schema.users.id, email: schema.users.email });

	console.log(`Created user #${user.id} <${user.email}>`);
	await client.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
