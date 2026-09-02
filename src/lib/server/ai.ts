import { env } from '$env/dynamic/private';
import type { Issue, Site } from '$db/schema';

export type IssueAiSummary = {
	whatHappened: string;
	whoIsAffected: string;
	likelyCause: string;
	recommendedAction: string;
};

const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a website health analyst for a monitoring tool. You explain technical
website errors in plain, calm English for a non-technical website owner, then add a short technical
note. You are given structured data about one grouped issue (an error/problem that occurred one or
more times on a WordPress website). Respond with ONLY a JSON object with these exact keys:
"whatHappened" (1-2 plain-English sentences), "whoIsAffected" (1 sentence about visitor/business
impact, or say impact is unclear if you can't tell), "likelyCause" (1-2 sentences, be honest if
uncertain), "recommendedAction" (1-2 sentences, concrete and actionable). Never invent specifics you
cannot infer from the provided data. Do not use markdown formatting.`;

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
		whatHappened: String(parsed.whatHappened ?? ''),
		whoIsAffected: String(parsed.whoIsAffected ?? ''),
		likelyCause: String(parsed.likelyCause ?? ''),
		recommendedAction: String(parsed.recommendedAction ?? '')
	};
}
