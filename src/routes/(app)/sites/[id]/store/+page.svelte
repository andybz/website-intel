<script lang="ts">
	import type { PageData } from './$types';
	import StatCard from '$lib/components/StatCard.svelte';
	import { formatRelativeTime } from '$lib/utils/time';
	import { getOrderStatusLabel, getOrderStatusColor, formatCurrency } from '$lib/utils/commerce';

	let { data }: { data: PageData } = $props();

	let mostRecentOrder = $derived(data.hasStore ? data.recentOrders[0] : null);
</script>

<svelte:head>
	<title>{data.site.name} — Store</title>
</svelte:head>

{#if !data.hasStore}
	<div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
		<h2 class="text-base font-medium text-neutral-900">No store detected</h2>
		<p class="mt-1 text-sm text-neutral-500">
			Once WooCommerce is active on this website and the CauseTrail plugin (v0.7.0+) reports
			in, store data will appear here.
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<StatCard label="Products Published" value={data.site.productCount ?? 0} tone="neutral" size="lg" />
			<StatCard label="Orders (7d)" value={data.ordersLast7Days} tone="green" size="lg" />
			<StatCard
				label="Revenue (7d)"
				value={formatCurrency(data.revenueLast7Days, data.site.storeCurrency)}
				tone="green"
				size="lg"
			/>
		</div>

		{#if mostRecentOrder}
			<div class="rounded-xl border border-neutral-200 bg-white p-6">
				<h2 class="text-base font-medium text-neutral-900">Most Recent Order</h2>
				<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="font-medium text-neutral-900">
							Order {mostRecentOrder.orderNumber ?? `#${mostRecentOrder.externalOrderId}`}
						</p>
						<p class="mt-1 text-sm text-neutral-500">
							{formatRelativeTime(mostRecentOrder.placedAt)}
							{#if mostRecentOrder.itemCount != null}
								· {mostRecentOrder.itemCount} {mostRecentOrder.itemCount === 1 ? 'item' : 'items'}
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-lg font-bold tracking-tight text-neutral-900">
							{formatCurrency(Number.parseFloat(mostRecentOrder.total) || 0, mostRecentOrder.currency)}
						</span>
						<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {getOrderStatusColor(mostRecentOrder.status)}">
							{getOrderStatusLabel(mostRecentOrder.status)}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<div class="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 class="text-base font-medium text-neutral-900">Recent Orders</h2>

			{#if data.recentOrders.length === 0}
				<p class="mt-3 text-sm text-neutral-500">No orders reported yet.</p>
			{:else}
				<ul class="mt-3 flex flex-col gap-2">
					{#each data.recentOrders as order (order.id)}
						<li class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 py-2.5 text-sm last:border-0">
							<div class="min-w-0">
								<span class="font-medium text-neutral-900">
									Order {order.orderNumber ?? `#${order.externalOrderId}`}
								</span>
								<span class="ml-2 text-neutral-400">{formatRelativeTime(order.placedAt)}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-neutral-700">
									{formatCurrency(Number.parseFloat(order.total) || 0, order.currency)}
								</span>
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {getOrderStatusColor(order.status)}">
									{getOrderStatusLabel(order.status)}
								</span>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}
