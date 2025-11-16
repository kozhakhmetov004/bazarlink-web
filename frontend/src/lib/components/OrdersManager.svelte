<script lang="ts">
	import { onMount } from 'svelte';
	import { ordersApi, productsApi } from '$lib/api';
	import { mapOrder } from '$lib/utils/mappers';
	import { supplier } from '$lib/stores/auth';
	import type { Order } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Check, X, Clock, Package } from 'lucide-svelte';

	let orders: Order[] = [];
	let loading = true;

	onMount(async () => {
		await loadOrders();
	});

	async function loadOrders() {
		try {
			loading = true;
			const supplierId = $supplier?.id;
			if (supplierId) {
				const ordersData = await ordersApi.getOrders({ supplier_id: parseInt(supplierId) });
				// Fetch product names for order items
				const ordersWithProductNames = await Promise.all(
					ordersData.map(async (order) => {
						const orderMapped = mapOrder(order);
						// Fetch product names
						const itemsWithNames = await Promise.all(
							order.items.map(async (item) => {
								try {
									const product = await productsApi.getProduct(item.product_id);
									return { ...item, productName: product.name };
								} catch {
									return { ...item, productName: `Product ${item.product_id}` };
								}
							})
						);
						return { ...orderMapped, items: itemsWithNames };
					})
				);
				orders = ordersWithProductNames;
			}
		} catch (error) {
			console.error('Failed to load orders', error);
		} finally {
			loading = false;
		}
	}

	async function handleAccept(id: string) {
		try {
			const orderId = parseInt(id);
			await ordersApi.updateOrder(orderId, { status: 'accepted' });
			await loadOrders();
		} catch (error) {
			console.error('Failed to accept order', error);
		}
	}

	async function handleReject(id: string) {
		try {
			const orderId = parseInt(id);
			await ordersApi.updateOrder(orderId, { status: 'rejected' });
			await loadOrders();
		} catch (error) {
			console.error('Failed to reject order', error);
		}
	}

	async function handleComplete(id: string) {
		try {
			const orderId = parseInt(id);
			await ordersApi.updateOrder(orderId, { status: 'completed' });
			await loadOrders();
		} catch (error) {
			console.error('Failed to complete order', error);
		}
	}

	function getStatusBadge(status: Order['status']) {
		const variants = {
			pending: { label: 'Pending', icon: Clock, color: 'text-orange-600' },
			accepted: { label: 'Accepted', icon: Check, color: 'text-green-600' },
			rejected: { label: 'Rejected', icon: X, color: 'text-red-600' },
			completed: { label: 'Completed', icon: Package, color: 'text-blue-600' },
		};
		return variants[status];
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	$: pendingOrders = orders.filter(o => o.status === 'pending');
	$: activeOrders = orders.filter(o => o.status === 'accepted');
	$: completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'rejected');
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Order Management</h2>
		<p class="text-gray-600">View and manage bulk orders from buyers</p>
	</div>

	<!-- Pending Orders -->
	<Card>
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<Clock class="w-5 h-5 text-orange-600" />
				Pending Orders ({pendingOrders.length})
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if loading}
				<p class="text-gray-500 text-center py-8">Loading orders...</p>
			{:else if pendingOrders.length === 0}
				<p class="text-gray-500 text-center py-8">No pending orders</p>
			{:else}
				<div class="space-y-4">
					{#each pendingOrders as order}
						{@const statusConfig = getStatusBadge(order.status)}
						{@const StatusIcon = statusConfig.icon}
						<div class="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
							<div class="flex items-start justify-between mb-4">
								<div>
									<div class="flex items-center gap-3 mb-2">
										<h4 class="text-gray-900">Order #{order.id}</h4>
										<Badge variant={order.status === 'accepted' || order.status === 'completed' ? 'default' : 'secondary'} className={order.status === 'accepted' || order.status === 'completed' ? 'bg-green-600' : ''}>
											<StatusIcon class="w-3 h-3 mr-1" />
											{statusConfig.label}
										</Badge>
									</div>
									<p class="text-sm text-gray-600">Customer: {order.consumerName}</p>
									<p class="text-xs text-gray-500">Placed {formatDate(order.createdAt)}</p>
								</div>
								<div class="text-right">
									<p class="text-green-700">
										${order.totalAmount.toFixed(2)}
									</p>
								</div>
							</div>
							<div class="border-t border-gray-100 pt-4 mt-4">
								<p class="text-sm font-medium text-gray-900 mb-2">Items:</p>
								<div class="space-y-2">
									{#each order.items as item}
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">{item.productName} x {item.quantity}</span>
											<span class="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
										</div>
									{/each}
								</div>
							</div>
							<div class="flex gap-2 mt-4">
								<Button
									variant="default"
									on:click={() => handleAccept(order.id)}
									className="flex-1 bg-green-600 hover:bg-green-700"
								>
									<Check class="w-4 h-4 mr-2" />
									Accept
								</Button>
								<Button
									variant="destructive"
									on:click={() => handleReject(order.id)}
									className="flex-1"
								>
									<X class="w-4 h-4 mr-2" />
									Reject
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Active Orders -->
	{#if activeOrders.length > 0}
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Package class="w-5 h-5 text-green-600" />
					Active Orders ({activeOrders.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each activeOrders as order}
						<div class="border border-gray-200 rounded-lg p-4">
							<div class="flex items-start justify-between mb-4">
								<div>
									<h4 class="text-gray-900 mb-1">Order #{order.id}</h4>
									<p class="text-sm text-gray-600">Customer: {order.consumerName}</p>
								</div>
								<Button
									variant="default"
									on:click={() => handleComplete(order.id)}
									className="bg-green-600 hover:bg-green-700"
								>
									<Check class="w-4 h-4 mr-2" />
									Mark Complete
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>

