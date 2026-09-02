<script lang="ts">
	let {
		label,
		value,
		tone = 'neutral'
	}: {
		label: string;
		value: number;
		tone?: 'green' | 'yellow' | 'orange' | 'red' | 'neutral';
	} = $props();

	const toneClasses: Record<string, string> = {
		green: 'text-emerald-600',
		yellow: 'text-amber-600',
		orange: 'text-orange-600',
		red: 'text-red-600',
		neutral: 'text-neutral-900'
	};
</script>

<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
	<p class="text-sm text-neutral-500">{label}</p>
	<p class="mt-1 text-2xl font-semibold {toneClasses[tone]}">{value}</p>
</div>
