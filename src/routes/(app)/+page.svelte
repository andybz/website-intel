<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import HealthRing from '$lib/components/HealthRing.svelte';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>CauseTrail</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-white">CauseTrail</h1>
			<p class="mt-1 text-sm text-white/60">
				{data.summary.total}
				{data.summary.total === 1 ? 'Website' : 'Websites'}
			</p>
		</div>

		<div class="flex items-center gap-3">
			<a href="/settings#add-user" class="text-sm text-white/60 hover:text-white">
				Create account
			</a>
			{#if data.sites.length > 0}
				<a href="/sites/new" class="btn-primary">
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

	{#if data.sites.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
			<h2 class="text-base font-medium text-neutral-900">No websites connected yet</h2>
			<p class="mt-1 text-sm text-neutral-500">Add your first website to start monitoring it.</p>
			<a href="/sites/new" class="btn-primary mt-4">
				Add Website
			</a>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.sites as site (site.id)}
				<li class="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-4">
						{#if site.health}
							<HealthRing score={site.health.score} grade={site.health.grade} status={site.health.status} size="sm" />
						{/if}
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<a href="/sites/{site.id}" class="font-medium text-neutral-900 hover:underline">
									{site.name}
								</a>
								<StatusBadge status={site.status} />
							</div>
							<p class="text-sm text-neutral-500">{site.url}</p>
							{#if site.status === 'connected'}
								<p class="text-xs text-neutral-400">Last seen {formatRelativeTime(site.lastHeartbeatAt)}</p>
							{/if}
							{#if site.latestIssue}
								<a
									href="/sites/{site.id}/issues/{site.latestIssue.id}"
									class="mt-2 flex items-center gap-2 hover:underline"
								>
									<SeverityBadge severity={site.latestIssue.currentSeverity} />
									<span class="break-words text-sm text-neutral-700">{site.latestIssue.message}</span>
								</a>
							{/if}
						</div>
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

