<script lang="ts">
	let { status }: { status: 'pending' | 'connected' | 'disconnected' } = $props();

	const labels: Record<string, string> = {
		pending: 'Pending',
		connected: 'Connected',
		disconnected: 'Disconnected'
	};

	const classes: Record<string, string> = {
		pending: 'bg-amber-50 text-amber-700 ring-amber-200',
		connected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
		disconnected: 'bg-red-50 text-red-700 ring-red-200'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset {classes[
		status
	]}"
>
	{labels[status]}
</span>
