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
		<a href="/" class="text-sm text-white/60 hover:text-white">&larr; Back to dashboard</a>

		<div class="mt-3 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold tracking-tight text-white">{data.site.name}</h1>
				<StatusBadge status={data.site.status} />
			</div>
			<a
				href="/sites/{data.site.id}/edit"
				class="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10"
			>
				Edit
			</a>
		</div>
		<p class="text-sm text-white/60">{data.site.url}</p>
	</div>

	<nav class="flex gap-1 overflow-x-auto border-b border-white/10">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class="shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition {page.url.pathname === tab.href
					? 'text-white'
					: 'border-transparent text-white/50 hover:text-white/80'}"
				style={page.url.pathname === tab.href
					? 'border-image: linear-gradient(90deg, var(--color-brand-blue), var(--color-brand-teal)) 1'
					: ''}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	{@render children()}
</div>
