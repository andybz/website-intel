<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in — Website Monitor</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
	<div class="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
		<h1 class="text-xl font-semibold text-neutral-900">Website Monitor</h1>
		<p class="mt-1 text-sm text-neutral-500">Sign in to your dashboard.</p>

		<form method="POST" class="mt-6 flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="email" class="text-sm font-medium text-neutral-700">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="username"
					required
					value={form?.email ?? ''}
					class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
				/>
			</div>

			<div class="flex flex-col gap-1">
				<label for="password" class="text-sm font-medium text-neutral-700">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
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
				Sign in
			</button>
		</form>
	</div>
</div>
