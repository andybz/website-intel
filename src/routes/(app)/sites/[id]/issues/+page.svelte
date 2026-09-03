<script lang="ts">
	import type { PageData } from './$types';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import EventTypeBadge from '$lib/components/EventTypeBadge.svelte';
	import { formatRelativeTime } from '$lib/utils/time';
	import { getEventTypeLabel } from '$lib/utils/event-labels';

	let { data }: { data: PageData } = $props();

	let selectedType = $state<string>('all');

	let typeCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const issue of data.issues) {
			counts.set(issue.eventType, (counts.get(issue.eventType) ?? 0) + 1);
		}
		return counts;
	});

	let filteredIssues = $derived(
		selectedType === 'all' ? data.issues : data.issues.filter((issue) => issue.eventType === selectedType)
	);
</script>

<svelte:head>
	<title>{data.site.name} — Issues</title>
</svelte:head>

{#if data.issues.length === 0}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">No issues detected</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Errors reported by the WordPress Connector will appear here, grouped and prioritized.
		</p>
	</div>
{:else}
	<div class="mb-4 flex flex-wrap gap-2">
		<button
			type="button"
			onclick={() => (selectedType = 'all')}
			class="rounded-full px-3 py-1 text-xs font-medium transition {selectedType === 'all'
				? 'brand-gradient-bg text-white'
				: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
		>
			All ({data.issues.length})
		</button>
		{#each [...typeCounts.entries()] as [eventType, count] (eventType)}
			<button
				type="button"
				onclick={() => (selectedType = eventType)}
				class="rounded-full px-3 py-1 text-xs font-medium transition {selectedType === eventType
					? 'brand-gradient-bg text-white'
					: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
			>
				{getEventTypeLabel(eventType)} ({count})
			</button>
		{/each}
	</div>

	{#if filteredIssues.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
			<h2 class="text-base font-medium text-neutral-900">No issues match this filter</h2>
		</div>
	{/if}

	<ul class="flex flex-col gap-3">
		{#each filteredIssues as issue (issue.id)}
			<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4 {issue.displayStatus === 'resolved' ? 'opacity-60' : ''}">
				<a href="/sites/{data.site.id}/issues/{issue.id}" class="flex flex-col gap-2">
					<div class="flex flex-wrap items-center gap-2">
						<span class="font-mono text-xs text-neutral-400">#{issue.id}</span>
						<SeverityBadge severity={issue.currentSeverity} />
						<EventTypeBadge eventType={issue.eventType} />
						{#if issue.displayStatus === 'resolved'}
							<span class="text-xs font-medium text-emerald-600">Resolved</span>
						{/if}
					</div>
					<p class="font-medium break-words text-neutral-900">{issue.message}</p>
					<p class="text-sm text-neutral-500">
						{issue.occurrenceCount}
						{issue.occurrenceCount === 1 ? 'occurrence' : 'occurrences'} · First seen {formatRelativeTime(
							issue.firstSeen
						)} · Last seen {formatRelativeTime(issue.lastSeen)}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/if}
