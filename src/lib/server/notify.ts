import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users, type Issue, type Site } from '$db/schema';
import { sendEmail } from '$lib/server/email';

// Fires at most once per issue per "wave" (see the ingestion endpoint - a
// resolved issue reoccurring resets notifiedAt so it can fire again).
export async function notifyIssue(issue: Issue, site: Site, currentSeverity: number) {
	const recipients = await db.select({ email: users.email }).from(users);
	if (recipients.length === 0) return;

	const origin = env.ORIGIN ?? 'http://localhost:5173';
	const issueUrl = `${origin}/sites/${site.id}/issues/${issue.id}`;

	const subject = `🔴 ${site.name}: ${issue.message}`;
	const text = [
		`${issue.message}`,
		``,
		`Site: ${site.name} (${site.url})`,
		`Impact: ${currentSeverity.toFixed(1)} / 10`,
		`${issue.occurrenceCount} occurrence${issue.occurrenceCount === 1 ? '' : 's'}`,
		``,
		`View issue: ${issueUrl}`
	].join('\n');
	const html = `
		<p><strong>${issue.message}</strong></p>
		<p>Site: ${site.name} (${site.url})</p>
		<p>Impact: ${currentSeverity.toFixed(1)} / 10</p>
		<p>${issue.occurrenceCount} occurrence${issue.occurrenceCount === 1 ? '' : 's'}</p>
		<p><a href="${issueUrl}">View issue</a></p>
	`;

	await sendEmail({
		to: recipients.map((r) => r.email),
		subject,
		text,
		html
	});
}
