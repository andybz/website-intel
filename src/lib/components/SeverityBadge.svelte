<script lang="ts">
	let { severity }: { severity: number } = $props();

	// README color philosophy: red is rare and reserved for critical.
	function tone(value: number) {
		if (value >= 8) return { label: 'Critical', classes: 'bg-red-50 text-red-700 ring-red-200' };
		if (value >= 5) return { label: 'Needs attention', classes: 'bg-orange-50 text-orange-700 ring-orange-200' };
		if (value >= 3) return { label: 'Worth knowing', classes: 'bg-amber-50 text-amber-700 ring-amber-200' };
		return { label: 'Minor', classes: 'bg-neutral-100 text-neutral-600 ring-neutral-200' };
	}

	let info = $derived(tone(severity));
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset {info.classes}"
>
	{info.label}
	<span class="opacity-70">{severity.toFixed(1)}</span>
</span>
