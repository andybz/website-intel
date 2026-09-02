<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Website Monitor</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div>
		<h1 class="text-2xl font-semibold text-neutral-900">Website Monitor</h1>
		<p class="mt-1 text-sm text-neutral-500">
			{data.summary.total}
			{data.summary.total === 1 ? 'Website' : 'Websites'}
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<StatCard label="Connected" value={data.summary.connected} tone="green" />
		<StatCard label="Pending" value={data.summary.pending} tone="yellow" />
		<StatCard label="Disconnected" value={data.summary.disconnected} tone="red" />
	</div>

	{#if data.sites.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
			<h2 class="text-base font-medium text-neutral-900">No websites connected yet</h2>
			<p class="mt-1 text-sm text-neutral-500">Add your first website to start monitoring it.</p>
			<button
				type="button"
				disabled
				title="Coming in the next step"
				class="mt-4 inline-flex cursor-not-allowed items-center rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500"
			>
				Add Website
			</button>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.sites as site (site.id)}
				<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
					<p class="font-medium text-neutral-900">{site.name}</p>
					<p class="text-sm text-neutral-500">{site.url}</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
