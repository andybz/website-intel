<script lang="ts">
	import type { PageData } from './$types';
	import { formatRelativeTime } from '$lib/utils/time';
	import { getEventTypeLabel } from '$lib/utils/event-labels';

	let { data }: { data: PageData } = $props();

	const CATEGORY_COLORS: Record<string, string> = {
		change: 'var(--color-brand-teal)',
		account: 'var(--color-brand-blue)',
		content: '#a855f7',
		security: '#f59e0b'
	};

	function categoryColor(category: string): string {
		return CATEGORY_COLORS[category] ?? 'var(--color-brand-teal)';
	}

	function metadataOf(entry: (typeof data.timeline)[number]) {
		return entry.metadata as { username?: string; role?: string; ipAddress?: string } | null;
	}
</script>

<svelte:head>
	<title>{data.site.name} — Activity</title>
</svelte:head>

{#if data.timeline.length === 0}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">Nothing to show yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Real site activity - logins, user account changes, content changes, and plugin/theme/core
			updates - will appear here as it happens.
		</p>
	</div>
{:else}
	<ul class="relative flex flex-col gap-4 pl-2">
		<div
			class="pointer-events-none absolute top-2 bottom-2 left-[11px] w-px"
			style="background-image: linear-gradient(to bottom, var(--color-brand-blue), var(--color-brand-teal)); opacity: 0.25"
		></div>
		{#each data.timeline as entry (entry.id)}
			{@const meta = metadataOf(entry)}
			<li class="relative pl-8">
				<span
					class="absolute top-4 left-0 h-3 w-3 rounded-full border-2 border-white ring-2"
					style="background-color: {categoryColor(entry.category)}; --tw-ring-color: color-mix(in srgb, {categoryColor(
						entry.category
					)} 40%, transparent)"
				></span>
				<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
					<div class="flex items-center gap-2">
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200"
						>
							<span class="h-1.5 w-1.5 rounded-full" style="background-color: {categoryColor(entry.category)}"
							></span>
							{getEventTypeLabel(entry.eventType)}
						</span>
					</div>
					<p class="mt-2 text-neutral-900">{entry.message}</p>
					<p class="mt-1 text-sm text-neutral-500">
						{formatRelativeTime(entry.occurredAt)}
						{#if meta?.ipAddress}
							· from {meta.ipAddress}
						{/if}
					</p>
				</div>
			</li>
		{/each}
	</ul>
{/if}
