<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import HealthBadge from '$lib/components/HealthBadge.svelte';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Website Monitor</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-neutral-900">Website Monitor</h1>
			<p class="mt-1 text-sm text-neutral-500">
				{data.summary.total}
				{data.summary.total === 1 ? 'Website' : 'Websites'}
			</p>
		</div>

		<div class="flex items-center gap-3">
			<a href="/settings#add-user" class="text-sm text-neutral-500 hover:text-neutral-700">
				Create account
			</a>
			{#if data.sites.length > 0}
				<a
					href="/sites/new"
					class="inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
				>
					Add Website
				</a>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<StatCard label="Connected" value={data.summary.connected} tone="green" />
		<StatCard label="Pending" value={data.summary.pending} tone="yellow" />
		<StatCard label="Disconnected" value={data.summary.disconnected} tone="red" />
	</div>

	{#if data.latestIssues.length > 0}
		<div>
			<h2 class="text-base font-medium text-neutral-900">Latest Issues</h2>
			<ul class="mt-3 flex flex-col gap-3">
				{#each data.latestIssues as issue (issue.id)}
					<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
						<a href="/sites/{issue.siteId}/issues/{issue.id}" class="flex flex-col gap-2">
							<div class="flex flex-wrap items-center gap-2">
								<SeverityBadge severity={issue.currentSeverity} />
								<span class="text-xs font-medium text-neutral-500">{issue.siteName}</span>
							</div>
							<p class="font-medium break-words text-neutral-900">{issue.message}</p>
							<p class="text-sm text-neutral-500">
								{issue.occurrenceCount}
								{issue.occurrenceCount === 1 ? 'occurrence' : 'occurrences'} · Last seen {formatRelativeTime(
									issue.lastSeen
								)}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

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
				<li class="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<a href="/sites/{site.id}" class="font-medium text-neutral-900 hover:underline">
								{site.name}
							</a>
							<StatusBadge status={site.status} />
							{#if site.health}
								<HealthBadge status={site.health.status} score={site.health.score} />
							{/if}
						</div>
						<p class="text-sm text-neutral-500">{site.url}</p>
						{#if site.status === 'connected'}
							<p class="text-xs text-neutral-400">Last seen {formatRelativeTime(site.lastHeartbeatAt)}</p>
						{/if}
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

