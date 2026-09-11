// Human-friendly labels for event types (README section 16 "extensible event
// system" - eventType is intentionally free-form text, not a pg enum).
const EVENT_TYPE_LABELS: Record<string, string> = {
	php_notice: 'PHP Notice',
	php_warning: 'PHP Warning',
	php_fatal: 'PHP Fatal Error',
	http_404: '404 Not Found',
	http_500: '500 Server Error',
	failed_login: 'Failed Login',
	plugin_updated: 'Plugin Updated',
	plugin_activated: 'Plugin Activated',
	plugin_deactivated: 'Plugin Deactivated',
	plugin_installed: 'Plugin Installed',
	plugin_deleted: 'Plugin Deleted',
	theme_updated: 'Theme Updated',
	theme_activated: 'Theme Activated',
	wordpress_updated: 'WordPress Updated',
	user_login: 'User Login',
	user_registered: 'User Registered',
	user_deleted: 'User Removed',
	user_role_changed: 'Role Changed',
	content_published: 'Published',
	content_updated: 'Content Updated',
	content_unpublished: 'Unpublished',
	content_trashed: 'Moved to Trash',
	content_deleted: 'Content Deleted'
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
