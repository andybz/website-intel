<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Edit {data.site.name} — CauseTrail</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-lg font-semibold text-neutral-900">Edit Website</h2>

		<form method="POST" class="mt-6 flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="name" class="text-sm font-medium text-neutral-700">Name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={form?.name ?? data.site.name}
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
					value={form?.url ?? data.site.url}
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
				Save Changes
			</button>
		</form>
	</div>
</div>
