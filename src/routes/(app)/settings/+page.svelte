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
	type SiteAccessResult = { userId?: number; error?: string; success?: boolean };
	let siteAccessResult = $derived(
		form && (form as { form?: string }).form === 'updateSiteAccess' ? (form as SiteAccessResult) : null
	);

	let addUserRole = $state<'admin' | 'client'>('client');
</script>

<svelte:head>
	<title>Settings — CauseTrail</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-8">
	<h1 class="text-2xl font-semibold text-white">Settings</h1>

	<div class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="text-base font-medium text-neutral-900">Change your password</h2>
		<p class="mt-1 text-sm text-neutral-500">Signed in as {data.user?.name || data.user?.email}.</p>

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

			<button type="submit" class="btn-primary mt-2 self-start">
				Update Password
			</button>
		</form>
	</div>

	{#if data.isAdmin}
		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Users</h2>
			<p class="mt-1 text-sm text-neutral-500">
				Admins can see and manage everything. Clients only see the website(s) assigned to them,
				view-only - no settings, no adding/editing/removing websites.
			</p>

			<ul class="mt-4 flex flex-col gap-3">
				{#each data.users as u (u.id)}
					<li class="rounded-lg border border-neutral-200 px-4 py-3">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="min-w-0 break-words">
								<p class="flex flex-wrap items-center gap-2 font-medium text-neutral-900">
									{u.name || u.email}
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {u.role === 'admin'
											? 'bg-neutral-900 text-white'
											: 'bg-neutral-100 text-neutral-600'}"
									>
										{u.role === 'admin' ? 'Admin' : 'Client'}
									</span>
									{#if u.id === data.user?.id}
										<span class="text-xs font-normal text-neutral-400">(you)</span>
									{/if}
								</p>
								<p class="text-xs text-neutral-500">{u.email} · Added {formatRelativeTime(u.createdAt)}</p>
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

						{#if u.role === 'client'}
							<details class="mt-3 group">
								<summary class="cursor-pointer text-xs font-medium text-neutral-500 select-none">
									{u.siteIds.length === 0 ? 'No website access yet' : `Access to ${u.siteIds.length} website${u.siteIds.length === 1 ? '' : 's'}`}
									- manage
								</summary>
								<form method="POST" action="?/updateSiteAccess" class="mt-2 flex flex-col gap-2">
									<input type="hidden" name="userId" value={u.id} />
									<div class="flex flex-col gap-1.5">
										{#each data.allSites as site (site.id)}
											<label class="flex items-center gap-2 text-sm text-neutral-700">
												<input
													type="checkbox"
													name="siteIds"
													value={site.id}
													checked={u.siteIds.includes(site.id)}
													class="rounded border-neutral-300"
												/>
												{site.name}
											</label>
										{/each}
									</div>
									<button
										type="submit"
										class="mt-1 self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
									>
										Save Access
									</button>
								</form>
								{#if siteAccessResult?.userId === u.id && siteAccessResult.error}
									<p class="mt-2 text-sm text-red-600">{siteAccessResult.error}</p>
								{/if}
								{#if siteAccessResult?.userId === u.id && siteAccessResult.success}
									<p class="mt-2 text-sm text-emerald-600">Access updated.</p>
								{/if}
							</details>
						{/if}

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
			<p class="mt-1 text-sm text-neutral-500">
				They'll get an email to set their own password - nothing to share with them yourself.
			</p>

			<form method="POST" action="?/addUser" class="mt-3 flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="newUserName" class="text-sm font-medium text-neutral-700">Name</label>
					<input
						id="newUserName"
						name="name"
						type="text"
						required
						value={form?.form === 'addUser' ? (form?.name ?? '') : ''}
						class="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
					/>
				</div>
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
					<span class="text-sm font-medium text-neutral-700">Role</span>
					<div class="flex gap-4 text-sm text-neutral-700">
						<label class="flex items-center gap-1.5">
							<input type="radio" name="role" value="client" bind:group={addUserRole} />
							Client (view-only, assigned websites)
						</label>
						<label class="flex items-center gap-1.5">
							<input type="radio" name="role" value="admin" bind:group={addUserRole} />
							Admin (full access)
						</label>
					</div>
				</div>

				{#if addUserRole === 'client'}
					<div class="flex flex-col gap-1.5">
						<span class="text-sm font-medium text-neutral-700">Website access</span>
						{#if data.allSites.length === 0}
							<p class="text-sm text-neutral-500">Add a website first before inviting a client.</p>
						{:else}
							{#each data.allSites as site (site.id)}
								<label class="flex items-center gap-2 text-sm text-neutral-700">
									<input type="checkbox" name="siteIds" value={site.id} class="rounded border-neutral-300" />
									{site.name}
								</label>
							{/each}
						{/if}
					</div>
				{/if}

				{#if form?.form === 'addUser' && form?.error}
					<p class="text-sm text-red-600">{form.error}</p>
				{/if}
				{#if form?.form === 'addUser' && form?.success}
					<p class="text-sm text-emerald-600">User added - they'll receive an email to set their password.</p>
				{/if}

				<button type="submit" class="btn-primary self-start">
					Add User
				</button>
			</form>
		</div>
	</div>
	{/if}
</div>
