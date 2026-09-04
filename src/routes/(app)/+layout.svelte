<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import logo from '$lib/assets/favicon.svg';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="brand-glow-backdrop min-h-screen">
	<header class="relative border-b border-white/10">
		<div
			class="pointer-events-none absolute inset-0 opacity-40"
			style="background-image: linear-gradient(90deg, transparent, var(--color-brand-blue), var(--color-brand-teal), transparent); height: 1px; top: auto; bottom: 0;"
		></div>
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2 text-sm font-semibold text-white">
				<img src={logo} alt="" class="h-6 w-6" />
				<span class="tracking-tight">CauseTrail</span>
			</a>

			<div class="flex items-center gap-3">
				<a href="/settings" class="text-sm text-white/60 transition hover:text-white">Settings</a>
				<span class="hidden text-sm text-white/60 sm:inline">{data.user?.name || data.user?.email}</span>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10"
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
