<script lang="ts">
	import type { ActionData } from './$types';
	import PairingInstructions from '$lib/components/PairingInstructions.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Add Website — Website Monitor</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<a href="/" class="text-sm text-neutral-500 hover:text-neutral-700">&larr; Back to dashboard</a>

	{#if form?.success}
		<div class="mt-4">
			<PairingInstructions siteName={form.site.name} token={form.pairingToken} />
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
