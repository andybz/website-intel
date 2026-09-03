<script lang="ts">
	let { siteName, token }: { siteName: string; token: string } = $props();
</script>

<div class="rounded-xl border border-neutral-200 bg-white p-6">
	<h1 class="text-lg font-semibold text-neutral-900">Connect {siteName}</h1>
	<p class="mt-1 text-sm text-neutral-500">Follow these steps to connect your WordPress website.</p>

	<ol class="mt-6 flex flex-col gap-3 text-sm text-neutral-700">
		<li>1. Install the Monitor Connector plugin.</li>
		<li>2. Open Settings &rarr; Monitor Connector.</li>
		<li>3. Paste this connection key:</li>
	</ol>

	<p
		class="mt-3 select-all rounded-md px-4 py-3 text-center font-mono text-base tracking-wide text-white"
		style="background-color: var(--color-brand-navy)"
	>
		{token}
	</p>

	<p class="mt-3 text-xs text-neutral-500">
		This key expires in 30 minutes and won't be shown again. If it expires, generate a new one.
	</p>

	<ol start="4" class="mt-3 flex flex-col gap-3 text-sm text-neutral-700">
		<li>4. Click Connect.</li>
	</ol>

	<a href="/" class="btn-primary mt-6">
		Done
	</a>
</div>
