<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatRelativeTime } from '$lib/utils/time';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Narrowing `form` by its `form` discriminant plus an unrelated loop
	// variable trips up SvelteKit's generated ActionData union type, so read
	// the reset-password result through a small locally-typed view instead.
	type ResetPasswordResult = { userId?: number; error?: string; success?: boolean };
	let resetResult = $derived(
		form && (form as { form?: string }).form === 'resetPassword' ? (form as ResetPasswordResult) : null
	);
</script>

<svelte:head>
	<title>Settings — Website Monitor</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-8">
	<h1 class="text-2xl font-semibold text-neutral-900">Settings</h1>

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-base font-medium text-neutral-900">Change your password</h2>
		<p class="mt-1 text-sm text-neutral-500">Signed in as {data.user?.email}.</p>

		<form method="POST" action="?/changePassword" class="mt-4 flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<label for="currentPassword" class="text-sm font-medium text-neutral-700">Current password</label>
				<input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autocomplete="current-password"
					required
					class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
				/>
			</div>
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
				<label for="confirmPassword" class="text-sm font-medium text-neutral-700">Confirm new password</label>
				<input
					id="confirmPassword"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
				/>
			</div>

			{#if form?.form === 'changePassword' && form?.error}
				<p class="text-sm text-red-600">{form.error}</p>
			{/if}
			{#if form?.form === 'changePassword' && form?.success}
				<p class="text-sm text-emerald-600">Password updated.</p>
			{/if}

			<button
				type="submit"
				class="mt-2 self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
			>
				Update Password
			</button>
		</form>
	</div>

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-base font-medium text-neutral-900">Users</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Anyone with a login here can see and manage everything - there are no separate permission
			levels yet.
		</p>

		<ul class="mt-4 flex flex-col gap-3">
			{#each data.users as u (u.id)}
				<li class="rounded-lg border border-neutral-200 px-4 py-3">
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="font-medium text-neutral-900">
								{u.email}
								{#if u.id === data.user?.id}
									<span class="text-xs font-normal text-neutral-400">(you)</span>
								{/if}
							</p>
							<p class="text-xs text-neutral-500">Added {formatRelativeTime(u.createdAt)}</p>
						</div>

						{#if u.id !== data.user?.id}
							<form method="POST" action="?/removeUser">
								<input type="hidden" name="userId" value={u.id} />
								<button
									type="submit"
									class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-red-50 hover:text-red-700"
								>
									Remove
								</button>
							</form>
						{/if}
					</div>

					<form method="POST" action="?/resetPassword" class="mt-3 flex items-end gap-2">
						<input type="hidden" name="userId" value={u.id} />
						<div class="flex flex-1 flex-col gap-1">
							<label for="resetPassword-{u.id}" class="text-xs font-medium text-neutral-700">
								Reset password
							</label>
							<input
								id="resetPassword-{u.id}"
								name="newPassword"
								type="password"
								placeholder="New password"
								autocomplete="new-password"
								required
								class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
							/>
						</div>
						<button
							type="submit"
							class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							Reset
						</button>
					</form>

					{#if resetResult?.userId === u.id && resetResult.error}
						<p class="mt-2 text-sm text-red-600">{resetResult.error}</p>
					{/if}
					{#if resetResult?.userId === u.id && resetResult.success}
						<p class="mt-2 text-sm text-emerald-600">Password reset. They'll need to sign in again.</p>
					{/if}
				</li>
			{/each}
		</ul>

		{#if form?.form === 'removeUser' && form?.error}
			<p class="mt-3 text-sm text-red-600">{form.error}</p>
		{/if}

		<div id="add-user" class="mt-6 border-t border-neutral-200 pt-6 scroll-mt-6">
			<h3 class="text-sm font-medium text-neutral-900">Add a user</h3>

			<form method="POST" action="?/addUser" class="mt-3 flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="newUserEmail" class="text-sm font-medium text-neutral-700">Email</label>
					<input
						id="newUserEmail"
						name="email"
						type="email"
						required
						value={form?.form === 'addUser' ? (form?.email ?? '') : ''}
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label for="newUserPassword" class="text-sm font-medium text-neutral-700">Password</label>
					<input
						id="newUserPassword"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>

				{#if form?.form === 'addUser' && form?.error}
					<p class="text-sm text-red-600">{form.error}</p>
				{/if}
				{#if form?.form === 'addUser' && form?.success}
					<p class="text-sm text-emerald-600">User added.</p>
				{/if}

				<button
					type="submit"
					class="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
				>
					Add User
				</button>
			</form>
		</div>
	</div>
</div>
