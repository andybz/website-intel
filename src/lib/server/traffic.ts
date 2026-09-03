// Basic user-agent-based bot classification (README section 26). Deliberately
// simple for the MVP - do not attempt perfect bot detection here; this is a
// heuristic first pass, not a security/anti-scraping tool.
export type TrafficClassification =
	| 'human'
	| 'search_crawler'
	| 'ai_crawler'
	| 'social_bot'
	| 'monitoring_service'
	| 'known_bot';

export const TRAFFIC_CLASSIFICATION_LABELS: Record<TrafficClassification, string> = {
	human: 'Human',
	search_crawler: 'Search Crawler',
	ai_crawler: 'AI Crawler',
	social_bot: 'Social Media Bot',
	monitoring_service: 'Monitoring Service',
	known_bot: 'Other Bot'
};

const SEARCH_CRAWLER_PATTERN = /googlebot|bingbot|duckduckbot|yandexbot|baiduspider|slurp|applebot/i;
const AI_CRAWLER_PATTERN =
	/gptbot|chatgpt-user|ccbot|claudebot|claude-web|anthropic-ai|perplexitybot|google-extended|bytespider|oai-searchbot/i;
const SOCIAL_BOT_PATTERN = /facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|discordbot|telegrambot/i;
const MONITORING_SERVICE_PATTERN = /uptimerobot|pingdom|statuscake|site24x7|updown\.io|freshping/i;
const GENERIC_BOT_PATTERN = /bot|crawler|spider|scrape|curl|wget|python-requests|axios|libwww/i;

export function classifyUserAgent(userAgent: string | null | undefined): TrafficClassification {
	const ua = (userAgent ?? '').trim();

	if (!ua) return 'known_bot'; // A real browser always sends a UA - treat blank as automation.
	if (SEARCH_CRAWLER_PATTERN.test(ua)) return 'search_crawler';
	if (AI_CRAWLER_PATTERN.test(ua)) return 'ai_crawler';
	if (SOCIAL_BOT_PATTERN.test(ua)) return 'social_bot';
	if (MONITORING_SERVICE_PATTERN.test(ua)) return 'monitoring_service';
	if (GENERIC_BOT_PATTERN.test(ua)) return 'known_bot';

	return 'human';
}

export function isBotClassification(classification: TrafficClassification): boolean {
	return classification !== 'human';
}
