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

	// Free, no-API-key screenshot service (screenshots the site's own public
	// homepage - nothing private). See https://developer.wordpress.com/docs/mshots/
	// It returns a "Generating Preview..." placeholder on the first request for
	// a URL - retry a few times with a cache-busting param until the real
	// screenshot is ready.
	let screenshotAttempt = $state(0);
	let screenshotUrl = $derived(
		`https://s.wordpress.com/mshots/v1/${encodeURIComponent(data.site.url)}?w=1000&h=700&r=${screenshotAttempt}`
	);
	let screenshotFailed = $state(false);

	$effect(() => {
		if (screenshotAttempt >= 6) return;
		const timer = setTimeout(() => {
			screenshotAttempt += 1;
		}, 4000);
		return () => clearTimeout(timer);
	});

	let maxTrendDay = $derived(Math.max(1, ...data.trafficTrend.map((d) => d.humans + d.bots)));
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

	{#if data.health.status === 'critical' && data.topIssues.length > 0}
		<a
			href="/sites/{data.site.id}/issues/{data.topIssues[0].id}"
			class="flex flex-col items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-4 transition hover:border-red-400 hover:bg-red-100 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex min-w-0 items-start gap-3">
				<span class="mt-1.5 flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500"></span>
				<div class="min-w-0">
					<p class="text-sm font-semibold text-red-800">Critical issue needs attention</p>
					<p class="mt-0.5 text-sm break-words text-red-700">{data.topIssues[0].message}</p>
				</div>
			</div>
			<span class="shrink-0 text-sm font-medium text-red-700">View &rarr;</span>
		</a>
	{/if}

	<div class="grid grid-cols-1 gap-6 {data.site.status === 'pending' ? '' : 'lg:grid-cols-5'}">
		<div class={data.site.status === 'pending' ? 'lg:max-w-xl' : 'lg:col-span-2'}>
			<div class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
				<div class="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
					<span class="h-2.5 w-2.5 rounded-full bg-red-400"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
					<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
				</div>
				{#if screenshotFailed}
					<div class="flex aspect-[10/7] items-center justify-center bg-neutral-50 px-6 text-center">
						<p class="text-sm text-neutral-400">Preview unavailable</p>
					</div>
				{:else}
					<img
						src={screenshotUrl}
						alt="Screenshot of {data.site.name}'s homepage"
						class="aspect-[10/7] w-full object-cover object-top"
						loading="lazy"
						onerror={() => (screenshotFailed = true)}
					/>
				{/if}
				<div class="flex items-center justify-between gap-2 px-4 py-3">
					<span class="truncate text-sm text-neutral-500">{data.site.url}</span>
					<a
						href={data.site.url}
						target="_blank"
						rel="noopener noreferrer"
						class="shrink-0 text-sm font-medium text-neutral-600 hover:text-neutral-900"
					>
						Visit &#8599;
					</a>
				</div>
			</div>
		</div>

		{#if data.site.status !== 'pending'}
			<div class="flex flex-col gap-6 lg:col-span-3">
				<div class="flex items-center gap-5 rounded-xl border border-neutral-200 bg-white px-6 py-5">
					<HealthRing score={data.health.score} grade={data.health.grade} status={data.health.status} size="lg" />
					<div>
						<p class="text-sm text-neutral-500">Website Health</p>
						<p class="mt-1 text-sm font-medium {healthColor[data.health.status]}">
							{healthCopy[data.health.status]}
						</p>
					</div>
				</div>

				{#if data.site.status === 'connected'}
					<div class="grid grid-cols-2 gap-4">
						<StatCard label="Real Visitors" value={data.traffic.humans} tone="green" size="lg" />
						<StatCard label="Bots" value={data.traffic.bots} tone="neutral" size="lg" />
						<StatCard label="Open Issues" value={data.issueCount} tone="yellow" size="lg" />
						<StatCard
							label="Critical"
							value={data.criticalCount}
							tone={data.criticalCount > 0 ? 'red' : 'neutral'}
							size="lg"
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if data.site.status === 'connected'}
		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Traffic (last 7 days)</h2>
			<div class="mt-4 flex h-32 items-end gap-3">
				{#each data.trafficTrend as day (day.label)}
					{@const total = day.humans + day.bots}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="flex h-24 w-full flex-col justify-end overflow-hidden rounded-t">
							{#if total === 0}
								<div class="h-0.5 w-full bg-neutral-200"></div>
							{:else}
								<div
									class="w-full bg-neutral-300"
									style="height: {(day.bots / maxTrendDay) * 96}px"
									title="{day.label}: {day.bots} bot pageviews"
								></div>
								<div
									class="brand-gradient-bg w-full"
									style="height: {(day.humans / maxTrendDay) * 96}px"
									title="{day.label}: {day.humans} human pageviews"
								></div>
							{/if}
						</div>
						<span class="text-xs text-neutral-400">{day.label}</span>
					</div>
				{/each}
			</div>
			<div class="mt-3 flex items-center gap-4 text-xs text-neutral-500">
				<span class="flex items-center gap-1.5"><span class="brand-gradient-bg h-2 w-2 rounded-full"></span> Human</span>
				<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-neutral-300"></span> Bot</span>
			</div>
		</div>

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

	<div>
		<div class="flex items-center justify-between">
			<h2 class="text-base font-medium text-white">Things worth knowing</h2>
			{#if data.issueCount > 0}
				<a href="/sites/{data.site.id}/issues" class="text-sm text-white/60 hover:text-white">
					View all issues &rarr;
				</a>
			{/if}
		</div>

		{#if data.topIssues.length === 0}
			<div class="mt-3 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
				<h2 class="text-base font-medium text-neutral-900">No issues to show yet</h2>
				<p class="mt-1 text-sm text-neutral-500">
					Your website is operating normally. No errors have been reported.
				</p>
			</div>
		{:else}
			<ul class="mt-3 flex flex-col gap-3">
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

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm">
		<div>
			<span class="text-neutral-500">Last seen</span>
			<span class="ml-1.5 font-medium text-neutral-900">{formatRelativeTime(data.site.lastHeartbeatAt)}</span>
		</div>
		<div>
			<span class="text-neutral-500">Connected since</span>
			<span class="ml-1.5 font-medium text-neutral-900">
				{data.site.connectedAt ? new Date(data.site.connectedAt).toLocaleString() : 'Not connected'}
			</span>
		</div>
		<div>
			<span class="text-neutral-500">WordPress</span>
			<span class="ml-1.5 font-medium text-neutral-900">{data.site.wordpressVersion ?? 'Unknown'}</span>
		</div>
		<div>
			<span class="text-neutral-500">PHP</span>
			<span class="ml-1.5 font-medium text-neutral-900">{data.site.phpVersion ?? 'Unknown'}</span>
		</div>
	</div>
</div>
