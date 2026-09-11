<script lang="ts">
	import type { PageData } from './$types';
	import type { ChartConfiguration } from 'chart.js';
	import StatCard from '$lib/components/StatCard.svelte';
	import ChartCanvas from '$lib/components/ChartCanvas.svelte';
	import { formatBytes, getLoadTimeRating, getAssetTypeLabel } from '$lib/utils/performance';

	let { data }: { data: PageData } = $props();

	const BRAND_BLUE = '#1677f2';
	const BRAND_TEAL = '#25c4c8';

	let loadTimeChart = $derived.by((): ChartConfiguration | null => {
		if (!data.hasData) return null;
		return {
			type: 'line',
			data: {
				labels: data.history.map((h) =>
					new Date(h.checkedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })
				),
				datasets: [
					{
						label: 'Load time (ms)',
						data: data.history.map((h) => h.loadTimeMs),
						borderColor: BRAND_BLUE,
						backgroundColor: `${BRAND_BLUE}22`,
						fill: true,
						tension: 0.3,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					y: { beginAtZero: true, ticks: { callback: (v) => `${v}ms` } },
					x: { ticks: { maxTicksLimit: 8 } }
				}
			}
		};
	});

	let assetsChart = $derived.by((): ChartConfiguration | null => {
		if (!data.hasData || data.assets.length === 0) return null;
		const top = data.assets.slice(0, 8);
		return {
			type: 'bar',
			data: {
				labels: top.map((a) => a.url.split('/').pop() || a.url),
				datasets: [
					{
						label: 'Size',
						data: top.map((a) => a.sizeBytes),
						backgroundColor: BRAND_TEAL
					}
				]
			},
			options: {
				indexAxis: 'y' as const,
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (ctx) => formatBytes(ctx.parsed.x ?? 0) } }
				},
				scales: {
					x: { beginAtZero: true, ticks: { callback: (v) => formatBytes(Number(v)) } }
				}
			}
		};
	});

	let rating = $derived(data.hasData ? getLoadTimeRating(data.latest.loadTimeMs) : null);
</script>

<svelte:head>
	<title>{data.site.name} — Performance</title>
</svelte:head>

{#if !data.hasData}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">No performance data yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Once the CauseTrail plugin (v0.10.0+) runs its first page-speed check, load time trends and
			the bulkiest assets on this website will appear here.
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<StatCard label="Latest Load Time" value="{data.latest.loadTimeMs}ms" tone={rating!.tone} />
			<StatCard label="Load Time Rating" value={rating!.label} tone={rating!.tone} />
			<StatCard
				label="Page Size"
				value={data.latest.pageSizeBytes ? formatBytes(data.latest.pageSizeBytes) : '—'}
				tone="neutral"
			/>
		</div>

		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Load Time Trend</h2>
			<p class="mt-1 text-sm text-neutral-500">Server response time for the homepage, checked periodically.</p>
			<div class="mt-4 h-64">
				{#if loadTimeChart}
					<ChartCanvas config={loadTimeChart} />
				{/if}
			</div>
		</div>

		{#if assetsChart}
			<div class="rounded-xl border border-neutral-200 bg-white p-6">
				<h2 class="text-base font-medium text-neutral-900">Bulkiest Assets</h2>
				<p class="mt-1 text-sm text-neutral-500">The largest files loaded on the homepage during the last check.</p>
				<div class="mt-4 h-64">
					<ChartCanvas config={assetsChart} />
				</div>
			</div>
		{/if}

		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">All Assets Checked</h2>
			<ul class="mt-4 flex flex-col divide-y divide-neutral-100">
				{#each data.assets as asset (asset.url)}
					<li class="flex items-center justify-between gap-4 py-2.5 text-sm">
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-neutral-700">{asset.url.split('/').pop() || asset.url}</p>
							<p class="truncate text-xs text-neutral-400">{asset.url}</p>
						</div>
						<span class="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
							{getAssetTypeLabel(asset.type)}
						</span>
						<span class="shrink-0 font-medium text-neutral-700">{formatBytes(asset.sizeBytes)}</span>
					</li>
				{:else}
					<li class="py-2.5 text-sm text-neutral-500">No individual assets were measured on the last check.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
