<script lang="ts">
	import type { PageData } from './$types';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.site.name} — Activity</title>
</svelte:head>

{#if data.entries.length === 0}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">No activity recorded yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Plugin updates, theme changes, and other WordPress activity will appear here.
		</p>
	</div>
{:else}
	<ul class="flex flex-col gap-3">
		{#each data.entries as entry (entry.id)}
			<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
				<p class="text-neutral-900">{entry.message}</p>
				<p class="mt-1 text-sm text-neutral-500">{formatRelativeTime(entry.occurredAt)}</p>
			</li>
		{/each}
	</ul>
{/if}
