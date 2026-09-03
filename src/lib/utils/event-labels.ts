// Human-friendly labels for event types (README section 16 "extensible event
// system" - eventType is intentionally free-form text, not a pg enum).
const EVENT_TYPE_LABELS: Record<string, string> = {
	php_notice: 'PHP Notice',
	php_warning: 'PHP Warning',
	php_fatal: 'PHP Fatal Error',
	http_404: '404 Not Found',
	http_500: '500 Server Error',
	failed_login: 'Failed Login'
};

export function getEventTypeLabel(eventType: string): string {
	if (EVENT_TYPE_LABELS[eventType]) return EVENT_TYPE_LABELS[eventType];
	// Fallback for any future/unmapped event type: "some_type" -> "Some Type".
	return eventType
		.split('_')
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(' ');
}
