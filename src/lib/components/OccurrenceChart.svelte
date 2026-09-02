<script lang="ts">
	// Simple CSS bar chart - no charting library needed for a sparkline-style view.
	let { buckets }: { buckets: { label: string; count: number }[] } = $props();

	let max = $derived(Math.max(1, ...buckets.map((b) => b.count)));
</script>

{#if buckets.length === 0}
	<p class="text-sm text-neutral-500">Not enough data yet to chart occurrences over time.</p>
{:else}
	<div class="flex h-24 items-end gap-0.5">
		{#each buckets as bucket, i (i)}
			<div class="group relative flex-1">
				<div
					class="rounded-t bg-neutral-300 transition-colors group-hover:bg-neutral-500"
					style="height: {bucket.count === 0 ? 2 : Math.max(4, (bucket.count / max) * 96)}px"
					title="{bucket.label}: {bucket.count}"
				></div>
			</div>
		{/each}
	</div>
	<div class="mt-1 flex justify-between text-xs text-neutral-400">
		<span>{buckets[0]?.label}</span>
		<span>{buckets[buckets.length - 1]?.label}</span>
	</div>
{/if}
