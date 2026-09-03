<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';

	let { data }: { data: PageData } = $props();

	let humanTotal = $derived(data.dayBuckets.reduce((sum, d) => sum + d.humans, 0));
	let botTotal = $derived(data.dayBuckets.reduce((sum, d) => sum + d.bots, 0));
	let maxDayTotal = $derived(Math.max(1, ...data.dayBuckets.map((d) => d.humans + d.bots)));
</script>

<svelte:head>
	<title>{data.site.name} — Traffic</title>
</svelte:head>

{#if data.totalPageviews === 0}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">No traffic data yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Once the Monitor Connector plugin (v0.4.0+) reports page views, a human vs. bot breakdown will
			appear here.
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<StatCard label="Total Pageviews (7d)" value={data.totalPageviews} tone="neutral" />
			<StatCard label="Real Visitors" value={humanTotal} tone="green" />
			<StatCard label="Bots" value={botTotal} tone="neutral" />
		</div>

		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Last 7 Days</h2>
			<div class="mt-4 flex h-32 items-end gap-3">
				{#each data.dayBuckets as day (day.label)}
					{@const total = day.humans + day.bots}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="flex h-24 w-full flex-col justify-end overflow-hidden rounded-t">
							{#if total === 0}
								<div class="h-0.5 w-full bg-neutral-200"></div>
							{:else}
								<div
									class="w-full bg-neutral-300"
									style="height: {(day.bots / maxDayTotal) * 96}px"
									title="{day.label}: {day.bots} bot pageviews"
								></div>
								<div
									class="w-full bg-emerald-500"
									style="height: {(day.humans / maxDayTotal) * 96}px"
									title="{day.label}: {day.humans} human pageviews"
								></div>
							{/if}
						</div>
						<span class="text-xs text-neutral-400">{day.label}</span>
					</div>
				{/each}
			</div>
			<div class="mt-3 flex items-center gap-4 text-xs text-neutral-500">
				<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500"></span> Human</span>
				<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-neutral-300"></span> Bot</span>
			</div>
		</div>

		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">By Type (last 7 days)</h2>
			<ul class="mt-4 flex flex-col gap-3">
				{#each data.breakdown as item (item.classification)}
					<li>
						<div class="flex items-center justify-between text-sm">
							<span class="font-medium text-neutral-700">{item.label}</span>
							<span class="text-neutral-500">{item.count} · {item.percentage}%</span>
						</div>
						<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
							<div
								class="h-full rounded-full {item.classification === 'human' ? 'bg-emerald-500' : 'bg-neutral-400'}"
								style="width: {item.percentage}%"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
