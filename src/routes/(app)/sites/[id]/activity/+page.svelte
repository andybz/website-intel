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
	<ul class="relative flex flex-col gap-4 pl-2">
		<div
			class="pointer-events-none absolute top-2 bottom-2 left-[11px] w-px"
			style="background-image: linear-gradient(to bottom, var(--color-brand-blue), var(--color-brand-teal)); opacity: 0.25"
		></div>
		{#each data.timeline as entry, i (`${entry.type}-${entry.type === 'issue' ? entry.issueId : i}`)}
			<li class="relative pl-8">
				<span
					class="absolute top-4 left-0 h-3 w-3 rounded-full border-2 border-white ring-2 {entry.type === 'issue'
						? 'ring-red-300'
						: 'ring-neutral-300'}"
					style="background-color: {entry.type === 'issue' ? '#ef4444' : 'var(--color-brand-teal)'}"
				></span>
				<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
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
							<span class="text-xs font-medium text-neutral-400">Change</span>
						</div>
						<p class="mt-2 text-neutral-900">{entry.message}</p>
						<p class="mt-1 text-sm text-neutral-500">{formatRelativeTime(entry.occurredAt)}</p>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
