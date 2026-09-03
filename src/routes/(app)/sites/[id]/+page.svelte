<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatRelativeTime, isHeartbeatStale } from '$lib/utils/time';
	import SeverityBadge from '$lib/components/SeverityBadge.svelte';
	import EventTypeBadge from '$lib/components/EventTypeBadge.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import HealthRing from '$lib/components/HealthRing.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let stale = $derived(
		data.site.status === 'connected' && isHeartbeatStale(data.site.lastHeartbeatAt)
	);

	const healthCopy: Record<string, string> = {
		healthy: 'Your website is operating normally. No critical issues detected.',
		needs_attention: 'Something worth reviewing has been detected on your website.',
		critical: 'A critical issue may be affecting your website right now.'
	};

	const healthColor: Record<string, string> = {
		healthy: 'text-emerald-600',
		needs_attention: 'text-amber-600',
		critical: 'text-red-600'
	};
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
	{:else if stale}
		<div class="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
			<p class="text-sm font-medium text-red-800">Connection lost</p>
			<p class="mt-1 text-sm text-red-700">
				No heartbeat received recently. The website may be offline, or its cron/heartbeat process
				may have stopped.
			</p>
		</div>
	{/if}

	{#if data.site.status === 'connected'}
		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Ask about this website</h2>
			<form method="POST" action="?/ask" class="mt-3 flex flex-col gap-2 sm:flex-row">
				<input
					type="text"
					name="question"
					required
					maxlength="300"
					placeholder="e.g. What changed this week?"
					value={form?.question ?? ''}
					class="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
				/>
				<button type="submit" class="btn-primary">
					Ask
				</button>
			</form>
			<p class="mt-2 text-xs text-neutral-400">
				Tip: reference an issue by its #ID (shown next to each issue below) for a more specific answer.
			</p>

			{#if form?.error}
				<p class="mt-3 text-sm text-red-600">{form.error}</p>
			{/if}
			{#if form?.answer}
				<div class="mt-4 rounded-lg bg-neutral-50 p-4">
					<p class="text-sm font-medium text-neutral-500">"{form.question}"</p>
					<p class="mt-1 text-sm text-neutral-800">{form.answer}</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if data.site.status !== 'pending'}
		<div class="flex items-center gap-5 rounded-xl border border-neutral-200 bg-white px-6 py-5">
			<HealthRing score={data.health.score} grade={data.health.grade} status={data.health.status} size="lg" />
			<div>
				<p class="text-sm text-neutral-500">Website Health</p>
				<p class="mt-1 text-sm font-medium {healthColor[data.health.status]}">
					{healthCopy[data.health.status]}
				</p>
			</div>
		</div>
	{/if}

	{#if data.site.status === 'connected'}
		<div>
			<h2 class="text-base font-medium text-white">Today's Snapshot</h2>
			<div class="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard label="Real Visitors" value={data.traffic.humans} tone="green" />
				<StatCard label="Bots" value={data.traffic.bots} tone="neutral" />
				<StatCard label="Issues" value={data.issueCount} tone="yellow" />
				<StatCard label="Critical" value={data.criticalCount} tone={data.criticalCount > 0 ? 'red' : 'neutral'} />
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
			<p class="text-sm text-neutral-500">Last seen</p>
			<p class="mt-1 text-base font-medium text-neutral-900">
				{formatRelativeTime(data.site.lastHeartbeatAt)}
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

	<div class="flex items-center justify-between">
		<h2 class="text-base font-medium text-white">Things worth knowing</h2>
		{#if data.issueCount > 0}
			<a href="/sites/{data.site.id}/issues" class="text-sm text-white/60 hover:text-white">
				View all issues &rarr;
			</a>
		{/if}
	</div>

	{#if data.topIssues.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
			<h2 class="text-base font-medium text-neutral-900">No issues to show yet</h2>
			<p class="mt-1 text-sm text-neutral-500">
				Your website is operating normally. No errors have been reported.
			</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.topIssues as issue (issue.id)}
				<li class="rounded-xl border border-neutral-200 bg-white px-5 py-4">
					<a href="/sites/{data.site.id}/issues/{issue.id}" class="flex flex-col gap-2">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-mono text-xs text-neutral-400">#{issue.id}</span>
							<SeverityBadge severity={issue.currentSeverity} />
							<EventTypeBadge eventType={issue.eventType} />
						</div>
						<p class="font-medium break-words text-neutral-900">{issue.message}</p>
						<p class="text-sm text-neutral-500">
							{issue.occurrenceCount}
							{issue.occurrenceCount === 1 ? 'occurrence' : 'occurrences'} today · Last seen {formatRelativeTime(
								issue.lastSeen
							)}
						</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
