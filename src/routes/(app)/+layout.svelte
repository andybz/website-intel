<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import logo from '$lib/assets/favicon.svg';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="min-h-screen bg-neutral-50">
	<header class="border-b border-neutral-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2 text-sm font-semibold text-neutral-900">
				<img src={logo} alt="" class="h-6 w-6" />
				CauseTrail
			</a>

			<div class="flex items-center gap-3">
				<a href="/settings" class="text-sm text-neutral-500 hover:text-neutral-700">Settings</a>
				<span class="hidden text-sm text-neutral-500 sm:inline">{data.user?.email}</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Sign out
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		{@render children()}
	</main>
</div>
