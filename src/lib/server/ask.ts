import { env } from '$env/dynamic/private';

const MODEL = 'gpt-4o-mini';

// README section 31: "The AI should query structured monitoring data before
// answering. Never allow it to hallucinate website state." This context is
// built entirely from safe, pre-selected fields - never raw metadata (which
// may contain IPs/usernames for failed_login issues, etc.) - see ask-context.ts.
const SYSTEM_PROMPT = `You are an assistant embedded in a website monitoring dashboard. You answer
questions about ONE specific monitored website using ONLY the structured data provided to you below -
never invent facts, numbers, or events that aren't present in that data. If the data doesn't contain
enough information to answer confidently, say so plainly rather than guessing. Keep answers concise
(2-4 sentences), plain English, no markdown formatting. You are not able to take any action on the
website - only observe and explain. Each issue has a numeric "id" shown to the user as "#123" next to
it in the dashboard - if the question references an issue by that number (e.g. "issue #123" or just
"123"), match it against that id field rather than guessing from the message text.`;

export type AskWebsiteContext = {
	site: { name: string; url: string; status: string; healthScore: number; healthGrade: string };
	openIssues: {
		id: number;
		message: string;
		eventType: string;
		severity: number;
		occurrenceCount: number;
		firstSeen: string;
		lastSeen: string;
	}[];
	recentActivity: { message: string; occurredAt: string }[];
	traffic7d: { humans: number; bots: number };
};

export async function answerWebsiteQuestion(question: string, context: AskWebsiteContext): Promise<string> {
	if (!env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not configured.');
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: MODEL,
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: `Website data:\n${JSON.stringify(context)}\n\nQuestion: ${question}` }
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

	return String(content).trim();
}
