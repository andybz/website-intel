<script lang="ts">
	import type { PageData } from './$types';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.site.name} — {data.issue.message}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<a href="/sites/{data.site.id}/issues" class="text-sm text-neutral-500 hover:text-neutral-700">
		&larr; Back to issues
	</a>

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<div class="flex flex-wrap items-center gap-2">
			<SeverityBadge severity={data.issue.currentSeverity} />
			{#if data.issue.displayStatus === 'resolved'}
				<span class="text-xs font-medium text-emerald-600">Resolved</span>
			{/if}
		</div>

		<h1 class="mt-3 text-lg font-semibold text-neutral-900">{data.issue.message}</h1>

		<p class="mt-2 text-sm text-neutral-600">
			Occurred {data.issue.occurrenceCount}
			{data.issue.occurrenceCount === 1 ? 'time' : 'times'}.
			First detected {formatRelativeTime(data.issue.firstSeen)}, last detected {formatRelativeTime(
				data.issue.lastSeen
			)}.
		</p>

		{#if data.issue.displayStatus === 'resolved'}
			<p class="mt-2 text-sm text-emerald-700">
				No new occurrences have been detected recently.
			</p>
		{/if}
	</div>

	<details class="group rounded-xl border border-neutral-200 bg-white p-6">
		<summary class="cursor-pointer text-sm font-medium text-neutral-700 select-none">
			View Technical Details
		</summary>

		<dl class="mt-4 flex flex-col gap-3 text-sm">
			<div>
				<dt class="text-neutral-500">Event type</dt>
				<dd class="font-mono text-neutral-900">{data.issue.eventType}</dd>
			</div>
			{#if data.issue.file}
				<div>
					<dt class="text-neutral-500">File</dt>
					<dd class="font-mono break-all text-neutral-900">
						{data.issue.file}{data.issue.line ? `:${data.issue.line}` : ''}
					</dd>
				</div>
			{/if}
			{#if data.issue.requestUrl}
				<div>
					<dt class="text-neutral-500">Request path</dt>
					<dd class="font-mono break-all text-neutral-900">{data.issue.requestUrl}</dd>
				</div>
			{/if}
			{#if data.issue.stackTrace}
				<div>
					<dt class="text-neutral-500">Stack trace</dt>
					<dd class="mt-1 overflow-x-auto rounded-md bg-neutral-900 p-3 font-mono text-xs text-neutral-100">
						<pre class="whitespace-pre-wrap">{data.issue.stackTrace}</pre>
					</dd>
				</div>
			{/if}
			<div>
				<dt class="text-neutral-500">Fingerprint</dt>
				<dd class="font-mono text-xs break-all text-neutral-400">{data.issue.fingerprint}</dd>
			</div>
		</dl>
	</details>
</div>
