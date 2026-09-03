<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Forgot password — CauseTrail</title>
</svelte:head>

<div class="brand-glow-backdrop flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/40">
		<h1 class="text-xl font-bold tracking-tight text-neutral-900">Reset your password</h1>

		{#if form?.success}
			<p class="mt-4 text-sm text-neutral-600">
				If an account exists for that email, we've sent a link to reset the password. It expires
				in 30 minutes.
			</p>
			<a href="/login" class="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-700">
				&larr; Back to sign in
			</a>
		{:else}
			<p class="mt-1 text-sm text-neutral-500">
				Enter your email and we'll send you a link to reset your password.
			</p>

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

				{#if form?.error}
					<p class="text-sm text-red-600">{form.error}</p>
				{/if}

				<button type="submit" class="btn-primary mt-2 w-full">Send Reset Link</button>

				<a href="/login" class="text-center text-sm text-neutral-500 hover:text-neutral-700">
					Back to sign in
				</a>
			</form>
		{/if}
	</div>
</div>
