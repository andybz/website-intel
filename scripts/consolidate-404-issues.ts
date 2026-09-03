// One-off maintenance script: consolidates pre-existing http_404 "page not
// found" issues (from before the plugin started grouping all 404s together
// under one issue per site - see class-andybz-monitor-change-tracker.php)
// into a single issue per site, matching the new consolidated fingerprint so
// future 404 events keep accumulating onto the same row instead of starting
// a fresh duplicate.
//
// Defaults to a dry run (prints what it would do, changes nothing). Pass
// --apply to actually perform the merge.
//
// Usage: npm run db:consolidate-404s -- [--apply]
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/index.ts';
import { computeFingerprint } from '../src/lib/server/fingerprint.ts';

async function main() {
	const apply = process.argv.includes('--apply');

	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
	}

	const client = postgres(process.env.DATABASE_URL);
	const db = drizzle(client, { schema });

	const CONSOLIDATED_MESSAGE = 'Pages not found are being requested on this website';
	const newFingerprint = computeFingerprint({ eventType: 'http_404', message: CONSOLIDATED_MESSAGE });

	const allSites = await db.select().from(schema.sites);

	let sitesAffected = 0;
	let rowsRemoved = 0;

	for (const site of allSites) {
		const rows = await db
			.select()
			.from(schema.issues)
			.where(and(eq(schema.issues.siteId, site.id), eq(schema.issues.eventType, 'http_404')));

		if (rows.length <= 1) continue;

		sitesAffected += 1;
		const totalOccurrences = rows.reduce((sum, r) => sum + r.occurrenceCount, 0);
		const firstSeen = rows.reduce((min, r) => (r.firstSeen < min ? r.firstSeen : min), rows[0].firstSeen);
		const lastSeen = rows.reduce((max, r) => (r.lastSeen > max ? r.lastSeen : max), rows[0].lastSeen);
		const mostRecent = [...rows].sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())[0];

		// Merge each row's topPaths (if present) into one combined tally, top 10.
		const pathTally = new Map<string, number>();
		for (const row of rows) {
			const meta = row.metadata as { topPaths?: { path: string; count: number }[] } | null;
			for (const entry of meta?.topPaths ?? []) {
				pathTally.set(entry.path, (pathTally.get(entry.path) ?? 0) + entry.count);
			}
			// Rows from before this feature existed have the path embedded in
			// the message itself instead - fold those in too.
			if (!meta?.topPaths && row.requestUrl) {
				pathTally.set(row.requestUrl, (pathTally.get(row.requestUrl) ?? 0) + row.occurrenceCount);
			}
		}
		const topPaths = [...pathTally.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([path, count]) => ({ path, count }));

		console.log(
			`${apply ? 'Merging' : '[dry run] Would merge'} ${rows.length} http_404 issues for site #${site.id} (${site.name}) into 1 - total ${totalOccurrences} occurrences, ${pathTally.size} distinct paths seen.`
		);

		if (!apply) continue;

		await db
			.update(schema.issues)
			.set({
				fingerprint: newFingerprint,
				message: CONSOLIDATED_MESSAGE,
				occurrenceCount: totalOccurrences,
				firstSeen,
				lastSeen,
				status: 'open',
				requestUrl: mostRecent.requestUrl,
				metadata: topPaths.length > 0 ? { topPaths } : null,
				updatedAt: new Date()
			})
			.where(eq(schema.issues.id, mostRecent.id));

		const otherIds = rows.filter((r) => r.id !== mostRecent.id).map((r) => r.id);
		for (const id of otherIds) {
			await db.delete(schema.issues).where(eq(schema.issues.id, id));
		}
		rowsRemoved += otherIds.length;
	}

	console.log(
		apply
			? `Done. Consolidated http_404 issues on ${sitesAffected} site(s), removed ${rowsRemoved} duplicate row(s).`
			: `Dry run complete. ${sitesAffected} site(s) would be affected. Re-run with --apply to make changes.`
	);

	await client.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
