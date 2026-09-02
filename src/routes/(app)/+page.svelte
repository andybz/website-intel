<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Website Monitor</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold text-neutral-900">Website Monitor</h1>
			<p class="mt-1 text-sm text-neutral-500">
				{data.summary.total}
				{data.summary.total === 1 ? 'Website' : 'Websites'}
			</p>
		</div>

		{#if data.sites.length > 0}
			<a
				href="/sites/new"
				class="inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
			>
				Add Website
			</a>
		{/if}
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
			<a
				href="/sites/new"
				class="mt-4 inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
			>
				Add Website
			</a>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.sites as site (site.id)}
				<li class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4">
					<div>
						<div class="flex items-center gap-2">
							<a href="/sites/{site.id}" class="font-medium text-neutral-900 hover:underline">
								{site.name}
							</a>
							<StatusBadge status={site.status} />
						</div>
						<p class="text-sm text-neutral-500">{site.url}</p>
					</div>

					<div class="flex items-center gap-2">
						<a
							href="/sites/{site.id}/edit"
							class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							Edit
						</a>
						<form method="POST" action="?/remove">
							<input type="hidden" name="siteId" value={site.id} />
							<button
								type="submit"
								class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-red-50 hover:text-red-700"
							>
								Remove
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

