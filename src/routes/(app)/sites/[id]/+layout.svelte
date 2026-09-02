<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const tabs = $derived([
		{ label: 'Overview', href: `/sites/${data.site.id}` },
		{ label: 'Issues', href: `/sites/${data.site.id}/issues` },
		{ label: 'Activity', href: `/sites/${data.site.id}/activity` },
		{ label: 'Traffic', href: `/sites/${data.site.id}/traffic` },
		{ label: 'WordPress', href: `/sites/${data.site.id}/wordpress` }
	]);
</script>

<div class="flex flex-col gap-6">
	<div>
		<a href="/" class="text-sm text-neutral-500 hover:text-neutral-700">&larr; Back to dashboard</a>

		<div class="mt-3 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-semibold text-neutral-900">{data.site.name}</h1>
				<StatusBadge status={data.site.status} />
			</div>
			<a
				href="/sites/{data.site.id}/edit"
				class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
			>
				Edit
			</a>
		</div>
		<p class="text-sm text-neutral-500">{data.site.url}</p>
	</div>

	<nav class="flex gap-1 overflow-x-auto border-b border-neutral-200">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class="shrink-0 px-3 py-2 text-sm font-medium {page.url.pathname === tab.href
					? 'border-b-2 border-neutral-900 text-neutral-900'
					: 'text-neutral-500 hover:text-neutral-700'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{@render children()}
</div>
