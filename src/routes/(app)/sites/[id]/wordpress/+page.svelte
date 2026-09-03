<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.site.name} — WordPress</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">WordPress version</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{data.site.wordpressVersion ?? 'Unknown'}
			</p>
		</div>
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">Active theme</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{data.site.activeTheme ?? 'Unknown'}
				{#if data.site.themeVersion}
					<span class="text-sm font-normal text-neutral-500">v{data.site.themeVersion}</span>
				{/if}
			</p>
		</div>
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">PHP version</p>
			<p class="mt-1 text-base font-medium text-neutral-900">{data.site.phpVersion ?? 'Unknown'}</p>
		</div>
	</div>

	<div>
		<h2 class="text-base font-medium text-white">Plugins</h2>

		{#if data.plugins.length === 0}
			<div
				class="mt-3 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center"
			>
				<p class="text-sm text-neutral-500">
					No plugin data received yet. This will populate once the WordPress Connector plugin
					checks in.
				</p>
			</div>
		{:else}
			<ul class="mt-3 flex flex-col gap-2">
				{#each data.plugins as plugin (plugin.id)}
					<li
						class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-3"
					>
						<div>
							<p class="font-medium text-neutral-900">{plugin.name}</p>
							<p class="text-sm text-neutral-500">v{plugin.version ?? 'Unknown'}</p>
						</div>
						<span class="text-sm {plugin.isActive ? 'text-emerald-600' : 'text-neutral-400'}">
							{plugin.isActive ? 'Active' : 'Inactive'}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
