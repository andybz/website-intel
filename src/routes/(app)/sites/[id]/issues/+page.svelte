<script lang="ts">
	import type { PageData } from './$types';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();
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
	<ul class="flex flex-col gap-3">
		{#each data.issues as issue (issue.id)}
			<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
				<a href="/sites/{data.site.id}/issues/{issue.id}" class="flex flex-col gap-2">
					<div class="flex flex-wrap items-center gap-2">
						<SeverityBadge severity={issue.currentSeverity} />
						{#if issue.status === 'resolved'}
							<span class="text-xs font-medium text-emerald-600">Resolved</span>
						{/if}
					</div>
					<p class="font-medium text-neutral-900">{issue.message}</p>
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
