<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import OccurrenceChart from '$lib/components/OccurrenceChart.svelte';
	import { formatRelativeTime } from '$lib/utils/time';
	import type { IssueAiSummary } from '$lib/server/ai';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let aiSummary = $derived(data.issue.aiSummary as IssueAiSummary | null);
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

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-base font-medium text-neutral-900">Occurrences (last 48 hours)</h2>
		<div class="mt-4">
			<OccurrenceChart buckets={data.chartBuckets} />
		</div>
	</div>

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<h2 class="text-base font-medium text-neutral-900">AI Explanation</h2>
			{#if aiSummary}
				<span class="text-xs text-neutral-400">
					Generated {formatRelativeTime(data.issue.aiSummaryGeneratedAt)}
				</span>
			{/if}
		</div>

		{#if aiSummary}
			<dl class="mt-4 flex flex-col gap-4 text-sm">
				<div>
					<dt class="font-medium text-neutral-700">What Happened</dt>
					<dd class="mt-1 text-neutral-600">{aiSummary.whatHappened}</dd>
				</div>
				<div>
					<dt class="font-medium text-neutral-700">Who Is Affected</dt>
					<dd class="mt-1 text-neutral-600">{aiSummary.whoIsAffected}</dd>
				</div>
				<div>
					<dt class="font-medium text-neutral-700">Likely Cause</dt>
					<dd class="mt-1 text-neutral-600">{aiSummary.likelyCause}</dd>
				</div>
				<div>
					<dt class="font-medium text-neutral-700">Recommended Action</dt>
					<dd class="mt-1 text-neutral-600">{aiSummary.recommendedAction}</dd>
				</div>
			</dl>
			<form method="POST" action="?/generateSummary" class="mt-4">
				<button
					type="submit"
					class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
				>
					Regenerate
				</button>
			</form>
		{:else}
			<p class="mt-1 text-sm text-neutral-500">
				Get a plain-English explanation of what happened, who's affected, the likely cause, and
				what to do next.
			</p>
			<form method="POST" action="?/generateSummary" class="mt-4">
				<button
					type="submit"
					class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
				>
					Get AI Explanation
				</button>
			</form>
		{/if}

		{#if form?.error}
			<p class="mt-3 text-sm text-red-600">{form.error}</p>
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
