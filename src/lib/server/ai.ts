import { env } from '$env/dynamic/private';
import type { Issue, Site } from '$db/schema';

export type IssueAiSummary = {
	summary: string;
	technicalFix: string;
};

const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a website health analyst for a monitoring tool. You are given
structured data about one grouped issue (an error/problem that occurred one or more times on a
WordPress website). Respond with ONLY a JSON object with exactly these two keys:
"summary": 2-3 plain-English sentences for a non-technical website owner, explaining what this issue
means in everyday terms and whether it likely affects visitors. No jargon, no file paths, no code.
"technicalFix": a developer-facing explanation, written as if you were a senior developer helping a
teammate fix this exact issue. Identify the likely root cause, then ALWAYS end with the actual
corrected code inline in this same string - never just describe or promise a fix without showing it.
This field is already displayed in a monospace code block in the UI, so do NOT wrap code in markdown
triple-backtick fences - just write it plainly, on its own lines after the prose. Only if a file/line
is NOT provided and you truly cannot infer where the problem is, say so honestly and suggest what to
check next instead of inventing a file. Never invent facts (file contents, plugin names, etc.) you
cannot infer from the provided data.

Example of a correctly-formatted "technicalFix" value (yours will differ based on the actual issue):
"The undefined array key warning means the code reads $data['user_id'] without first confirming that
key exists. Update wp-content/themes/example/functions.php around line 88 to guard the access:

if (isset($data['user_id'])) {
    $user_id = $data['user_id'];
} else {
    $user_id = 0;
}"`;

export async function generateIssueSummary(issue: Issue, site: Site): Promise<IssueAiSummary> {
	if (!env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not configured.');
	}

	const facts = {
		site: site.name,
		eventType: issue.eventType,
		category: issue.category,
		message: issue.message,
		file: issue.file,
		line: issue.line,
		occurrenceCount: issue.occurrenceCount,
		firstSeen: issue.firstSeen,
		lastSeen: issue.lastSeen,
		requestUrl: issue.requestUrl,
		// Stack traces can be long; a short excerpt is enough context for a summary.
		stackTraceExcerpt: issue.stackTrace?.slice(0, 800) ?? null
	};

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: MODEL,
			response_format: { type: 'json_object' },
			// Enough headroom for a full explanation plus an inline code fix without truncating mid-answer.
			max_tokens: 900,
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: JSON.stringify(facts) }
			]
		})
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`OpenAI API error (${response.status}): ${body}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error('OpenAI returned no content.');
	}

	const parsed = JSON.parse(content);
	return {
		summary: String(parsed.summary ?? ''),
		technicalFix: String(parsed.technicalFix ?? '')
	};
}
