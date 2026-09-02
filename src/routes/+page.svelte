<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Website Monitor</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 px-4">
	<h1 class="text-2xl font-semibold text-neutral-900">Website Monitor</h1>
	<p class="text-neutral-600">Signed in as {data.user?.email}.</p>
	<p class="text-sm text-neutral-500">
		The dashboard shell hasn't been built yet — this is a placeholder confirming authentication
		works.
	</p>
	<form method="POST" action="/logout">
		<button
			type="submit"
			class="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
		>
			Sign out
		</button>
	</form>
</div>
