<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.site.name} — Overview</title>
</svelte:head>

<div class="flex flex-col gap-6">
	{#if data.site.status === 'pending'}
		<div class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
			<p class="text-sm font-medium text-amber-800">Waiting for connection</p>
			<p class="mt-1 text-sm text-amber-700">
				This website hasn't connected yet. Install the Monitor Connector plugin and enter the
				pairing key to get started.
			</p>
			<a
				href="/sites/{data.site.id}/connect"
				class="mt-3 inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
			>
				View setup instructions
			</a>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">Last seen</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{data.site.lastHeartbeatAt ? new Date(data.site.lastHeartbeatAt).toLocaleString() : 'Never'}
			</p>
		</div>
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">Connected since</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{data.site.connectedAt ? new Date(data.site.connectedAt).toLocaleString() : 'Not connected'}
			</p>
		</div>
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">WordPress version</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{data.site.wordpressVersion ?? 'Unknown'}
			</p>
		</div>
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">PHP version</p>
			<p class="mt-1 text-base font-medium text-neutral-900">{data.site.phpVersion ?? 'Unknown'}</p>
		</div>
	</div>

	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
		<h2 class="text-base font-medium text-neutral-900">No issues to show yet</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Error and event monitoring hasn't been built yet — this is where detected issues will
			appear.
		</p>
	</div>
</div>
