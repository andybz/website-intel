<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Add Website — Website Monitor</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<a href="/" class="text-sm text-neutral-500 hover:text-neutral-700">&larr; Back to dashboard</a>

	{#if form?.success}
		<div class="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
			<h1 class="text-lg font-semibold text-neutral-900">Connect {form.site.name}</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Follow these steps to connect your WordPress website.
			</p>

			<ol class="mt-6 flex flex-col gap-3 text-sm text-neutral-700">
				<li>1. Install the Monitor Connector plugin.</li>
				<li>2. Open Settings &rarr; Monitor Connector.</li>
				<li>3. Paste this connection key:</li>
			</ol>

			<p
				class="mt-3 select-all rounded-md bg-neutral-900 px-4 py-3 text-center font-mono text-base tracking-wide text-white"
			>
				{form.pairingToken}
			</p>

			<p class="mt-3 text-xs text-neutral-500">
				This key expires in 30 minutes and won't be shown again. If it expires, disconnect and
				re-add the website to generate a new one.
			</p>

			<ol start="4" class="mt-3 flex flex-col gap-3 text-sm text-neutral-700">
				<li>4. Click Connect.</li>
			</ol>

			<a
				href="/"
				class="mt-6 inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
			>
				Done
			</a>
		</div>
	{:else}
		<div class="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
			<h1 class="text-lg font-semibold text-neutral-900">Add Website</h1>
			<p class="mt-1 text-sm text-neutral-500">Enter the details of the website to monitor.</p>

			<form method="POST" class="mt-6 flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="name" class="text-sm font-medium text-neutral-700">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						placeholder="Pelican Wire"
						value={form?.name ?? ''}
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="url" class="text-sm font-medium text-neutral-700">URL</label>
					<input
						id="url"
						name="url"
						type="url"
						required
						placeholder="https://pelicanwire.com"
						value={form?.url ?? ''}
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>

				{#if form?.error}
					<p class="text-sm text-red-600">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700"
				>
					Create Connection
				</button>
			</form>
		</div>
	{/if}
</div>
