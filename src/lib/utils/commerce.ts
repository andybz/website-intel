// Friendly labels/colors for WooCommerce order statuses (the standard set,
// plus common custom statuses fall back gracefully to a neutral look).
const STATUS_LABELS: Record<string, string> = {
	pending: 'Pending Payment',
	processing: 'Processing',
	'on-hold': 'On Hold',
	completed: 'Completed',
	cancelled: 'Cancelled',
	refunded: 'Refunded',
	failed: 'Failed',
	checkout_draft: 'Draft'
};

const STATUS_COLORS: Record<string, string> = {
	pending: 'text-neutral-600 bg-neutral-100',
	processing: 'text-blue-700 bg-blue-50',
	'on-hold': 'text-amber-700 bg-amber-50',
	completed: 'text-emerald-700 bg-emerald-50',
	cancelled: 'text-neutral-500 bg-neutral-100',
	refunded: 'text-orange-700 bg-orange-50',
	failed: 'text-red-700 bg-red-50',
	checkout_draft: 'text-neutral-500 bg-neutral-100'
};

// Statuses that represent confirmed/paid revenue, per standard WooCommerce
// reporting convention - excludes pending/failed/cancelled/refunded.
export const REVENUE_STATUSES = ['processing', 'completed'];

export function getOrderStatusLabel(status: string): string {
	if (STATUS_LABELS[status]) return STATUS_LABELS[status];
	return status
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(' ');
}

export function getOrderStatusColor(status: string): string {
	return STATUS_COLORS[status] ?? 'text-neutral-600 bg-neutral-100';
}

export function formatCurrency(amount: number, currency?: string | null): string {
	if (!currency) return amount.toFixed(2);
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
	} catch {
		// Unrecognized/invalid currency code - fall back to a plain number rather than throwing.
		return `${amount.toFixed(2)} ${currency}`;
	}
}
