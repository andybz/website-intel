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

	const dots: Record<string, string> = {
		pending: 'bg-amber-500',
		connected: 'bg-emerald-500',
		disconnected: 'bg-red-500'
	};
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset {classes[
		status
	]}"
>
	<span class="h-1.5 w-1.5 rounded-full {dots[status]}"></span>
	{labels[status]}
</span>
