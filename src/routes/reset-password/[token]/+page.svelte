<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Reset password — CauseTrail</title>
</svelte:head>

<div class="brand-glow-backdrop flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/40">
		<h1 class="text-xl font-bold tracking-tight text-neutral-900">Set a new password</h1>

		{#if !data.valid}
			<p class="mt-4 text-sm text-red-600">
				This reset link is invalid or has expired. Request a new one below.
			</p>
			<a
				href="/forgot-password"
				class="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-700"
			>
				Request a new link &rarr;
			</a>
		{:else}
			<form method="POST" class="mt-6 flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="newPassword" class="text-sm font-medium text-neutral-700">New password</label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						autocomplete="new-password"
						required
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label for="confirmPassword" class="text-sm font-medium text-neutral-700">
						Confirm new password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>

				{#if form?.error}
					<p class="text-sm text-red-600">{form.error}</p>
				{/if}

				<button type="submit" class="btn-primary mt-2 w-full">Reset Password</button>
			</form>
		{/if}
	</div>
</div>
