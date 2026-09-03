<script lang="ts">
	import type { ActionData } from './$types';
	import logo from '$lib/assets/favicon.svg';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in — CauseTrail</title>
</svelte:head>

<div class="brand-glow-backdrop flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/40">
		<div class="flex items-center gap-2.5">
			<img src={logo} alt="" class="h-9 w-9" />
			<h1 class="text-2xl font-bold tracking-tight text-neutral-900">CauseTrail</h1>
		</div>
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
					class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
					style="--tw-ring-color: var(--color-brand-blue)"
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
					class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
				/>
			</div>

			{#if form?.error}
				<p class="text-sm text-red-600">{form.error}</p>
			{/if}

			<button type="submit" class="btn-primary mt-2 w-full">Sign in</button>

			<a href="/forgot-password" class="text-center text-sm text-neutral-500 hover:text-neutral-700">
				Forgot password?
			</a>
		</form>
	</div>
</div>
