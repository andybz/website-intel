<script lang="ts">
	import type { PageData } from './$types';
	import { formatRelativeTime } from '$lib/utils/time';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.site.name} — Activity</title>
</svelte:head>

{#if data.timeline.length === 0}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">Nothing to show yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Detected issues and WordPress changes (plugin updates, activations, etc.) will appear here
			together, in the order they happened.
		</p>
	</div>
{:else}
	<ul class="flex flex-col gap-3">
		{#each data.timeline as entry, i (`${entry.type}-${entry.type === 'issue' ? entry.issueId : i}`)}
			<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
				{#if entry.type === 'issue'}
					<a href="/sites/{data.site.id}/issues/{entry.issueId}" class="flex flex-col gap-2">
						<div class="flex flex-wrap items-center gap-2">
							<SeverityBadge severity={entry.severity} />
							<span class="text-xs font-medium text-neutral-400">Issue detected</span>
						</div>
						<p class="text-neutral-900">{entry.message}</p>
						<p class="text-sm text-neutral-500">{formatRelativeTime(entry.occurredAt)}</p>
					</a>
				{:else}
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-neutral-300"></span>
						<span class="text-xs font-medium text-neutral-400">Change</span>
					</div>
					<p class="mt-2 text-neutral-900">{entry.message}</p>
					<p class="mt-1 text-sm text-neutral-500">{formatRelativeTime(entry.occurredAt)}</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
