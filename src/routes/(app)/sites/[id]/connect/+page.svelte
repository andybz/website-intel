<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import PairingInstructions from '$lib/components/PairingInstructions.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Connect {data.site.name}</title>
</svelte:head>

{#if form?.pairingToken}
	<PairingInstructions siteName={data.site.name} token={form.pairingToken} />
{:else}
	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-base font-medium text-neutral-900">Generate a new connection key</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Generate a pairing key to install and connect the Monitor Connector plugin on this website.
		</p>
		<form method="POST" class="mt-4">
			<button
				type="submit"
				class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
			>
				Generate Connection Key
			</button>
		</form>
	</div>
{/if}
