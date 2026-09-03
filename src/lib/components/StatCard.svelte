<script lang="ts">
	let {
		label,
		value,
		tone = 'neutral',
		size = 'md'
	}: {
		label: string;
		value: number;
		tone?: 'green' | 'yellow' | 'orange' | 'red' | 'neutral';
		size?: 'md' | 'lg';
	} = $props();

	const toneClasses: Record<string, string> = {
		green: 'text-emerald-600',
		yellow: 'text-amber-600',
		orange: 'text-orange-600',
		red: 'text-red-600',
		neutral: 'text-neutral-900'
	};
</script>

<div class="relative overflow-hidden rounded-xl border border-neutral-200 bg-white px-5 py-4">
	{#if tone === 'neutral' || tone === 'green'}
		<div class="brand-gradient-bg absolute inset-x-0 top-0 h-0.5"></div>
	{/if}
	<p class="text-sm text-neutral-500">{label}</p>
	<p class="mt-1 font-bold tracking-tight {size === 'lg' ? 'text-4xl' : 'text-2xl font-semibold'} {toneClasses[tone]}">
		{value}
	</p>
</div>
