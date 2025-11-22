<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ordersApi, productsApi } from '$lib/api';
	import { supplier } from '$lib/stores/auth';
	import type { OrderResponse } from '$lib/api/orders';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { _ } from 'svelte-i18n';
	import { ArrowLeft, Check, X, Clock, Package, ShoppingCart, MapPin, Calendar, FileText } from 'lucide-svelte';

	let order: OrderResponse | null = null;
	let loading = true;
	let error = '';
	let productNames: Record<number, string> = {};

	$: orderId = parseInt($page.params.id || '0');

	onMount(async () => {
		await loadOrder();
	});

	async function loadOrder() {
		if (!orderId) {
			error = $_('orders.orderNotFound');
			loading = false;
			return;
		}

		try {
			loading = true;
			error = '';
			
			order = await ordersApi.getOrder(orderId);
			
			// Load product names for all items
			if (order?.items) {
				const productPromises = order.items.map(async (item) => {
					try {
						const product = await productsApi.getProduct(item.product_id);
						return { productId: item.product_id, name: product.name };
					} catch {
						return { productId: item.product_id, name: `Product ${item.product_id}` };
					}
				});
				
				const products = await Promise.all(productPromises);
				products.forEach(({ productId, name }) => {
					productNames[productId] = name;
				});
			}
		} catch (err: any) {
			console.error('Failed to load order:', err);
			error = err?.message || $_('orders.loadingOrder');
		} finally {
			loading = false;
		}
	}

	async function handleAccept() {
		if (!order) return;
		try {
			await ordersApi.updateOrder(order.id, { status: 'accepted' });
			await loadOrder();
		} catch (err) {
			console.error('Failed to accept order:', err);
		}
	}

	async function handleReject() {
		if (!order) return;
		try {
			await ordersApi.updateOrder(order.id, { status: 'rejected' });
			await loadOrder();
		} catch (err) {
			console.error('Failed to reject order:', err);
		}
	}

	async function handleComplete() {
		if (!order) return;
		try {
			await ordersApi.updateOrder(order.id, { status: 'completed' });
			await loadOrder();
		} catch (err) {
			console.error('Failed to complete order:', err);
		}
	}

	function getStatusConfig(status: OrderResponse['status']) {
		const configs = {
			pending: { labelKey: 'common.pending', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
			accepted: { labelKey: 'common.accepted', icon: Check, color: 'text-green-600', bgColor: 'bg-green-50' },
			rejected: { labelKey: 'common.rejected', icon: X, color: 'text-red-600', bgColor: 'bg-red-50' },
			completed: { labelKey: 'common.completed', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
			cancelled: { labelKey: 'common.cancelled', icon: X, color: 'text-gray-600', bgColor: 'bg-gray-50' },
		};
		return configs[status] || configs.pending;
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString();
	}

	function formatCurrency(amount: number, currency: string = 'KZT'): string {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: currency,
		}).format(amount);
	}
</script>

<div class="space-y-6">
	<!-- Back Button -->
	<Button
		variant="outline"
		on:click={() => goto('/orders')}
		className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
	>
		<ArrowLeft class="w-4 h-4" />
		{$_('common.back')}
	</Button>

	{#if loading}
		<Card>
			<CardContent className="p-8">
				<p class="text-gray-500 text-center">{$_('orders.loadingOrder')}</p>
			</CardContent>
		</Card>
	{:else if error}
		<Card>
			<CardContent className="p-8">
				<p class="text-red-600 text-center">{error}</p>
			</CardContent>
		</Card>
	{:else if !order}
		<Card>
			<CardContent className="p-8">
				<p class="text-gray-500 text-center">{$_('orders.orderNotFound')}</p>
			</CardContent>
		</Card>
	{:else}
		{@const statusConfig = getStatusConfig(order.status)}
		{@const StatusIcon = statusConfig.icon}

		<!-- Order Header -->
		<Card className="border-0 shadow-md">
			<CardHeader className="border-b border-gray-100 px-6 py-5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="p-3 rounded-xl {statusConfig.bgColor}">
							<StatusIcon class="w-6 h-6 {statusConfig.color}" />
						</div>
						<div>
							<CardTitle className="flex items-center gap-3 mb-2">
								{$_('orders.order')} #{order.order_number}
								<Badge variant={order.status === 'accepted' || order.status === 'completed' ? 'default' : 'secondary'} 
									className={order.status === 'accepted' || order.status === 'completed' ? 'bg-green-600' : ''}>
									<StatusIcon class="w-3 h-3 mr-1" />
									{$_(statusConfig.labelKey)}
								</Badge>
							</CardTitle>
							<p class="text-sm text-gray-600">
								{$_('orders.placed')} {formatDate(order.created_at)}
							</p>
						</div>
					</div>
					<div class="text-right">
						<p class="text-2xl font-bold text-green-700">
							{formatCurrency(order.total, order.currency)}
						</p>
						<p class="text-sm text-gray-500">{$_('orders.total')}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<!-- Action Buttons -->
				{#if order.status === 'pending'}
					<div class="flex gap-3 mb-6">
						<Button
							variant="default"
							on:click={handleAccept}
							className="flex-1 bg-green-600 hover:bg-green-700"
						>
							<Check class="w-4 h-4 mr-2" />
							{$_('orders.accept')}
						</Button>
						<Button
							variant="destructive"
							on:click={handleReject}
							className="flex-1"
						>
							<X class="w-4 h-4 mr-2" />
							{$_('orders.reject')}
						</Button>
					</div>
				{:else if order.status === 'accepted'}
					<div class="mb-6">
						<Button
							variant="default"
							on:click={handleComplete}
							className="bg-green-600 hover:bg-green-700"
						>
							<Package class="w-4 h-4 mr-2" />
							{$_('orders.markComplete')}
						</Button>
					</div>
				{/if}

				<!-- Order Items -->
				<div class="space-y-4 mb-6">
					<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<ShoppingCart class="w-5 h-5" />
						{$_('orders.items')}
					</h3>
					<div class="space-y-3">
						{#each order.items as item}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div class="flex-1">
									<p class="font-medium text-gray-900">
										{productNames[item.product_id] || `Product ${item.product_id}`}
									</p>
									<p class="text-sm text-gray-600">
										{formatCurrency(item.unit_price, order.currency)} × {item.quantity}
									</p>
								</div>
								<div class="text-right">
									<p class="font-semibold text-gray-900">
										{formatCurrency(item.total_price, order.currency)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Order Summary -->
				<div class="border-t border-gray-200 pt-6 space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">{$_('orders.subtotal')}</span>
						<span class="text-gray-900">{formatCurrency(order.subtotal, order.currency)}</span>
					</div>
					<div class="flex justify-between text-lg font-semibold">
						<span class="text-gray-900">{$_('orders.total')}</span>
						<span class="text-green-700">{formatCurrency(order.total, order.currency)}</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Order Details -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Delivery Information -->
			{#if order.delivery_method || order.delivery_address}
				<Card className="border-0 shadow-md">
					<CardHeader className="border-b border-gray-100 px-6 py-5">
						<CardTitle className="flex items-center gap-2">
							<MapPin class="w-5 h-5 text-green-600" />
							{$_('orders.deliveryInfo')}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-6 space-y-3">
						{#if order.delivery_method}
							<div>
								<p class="text-sm text-gray-600 mb-1">{$_('orders.deliveryMethod')}</p>
								<p class="text-gray-900">{order.delivery_method}</p>
							</div>
						{/if}
						{#if order.delivery_address}
							<div>
								<p class="text-sm text-gray-600 mb-1">{$_('orders.deliveryAddress')}</p>
								<p class="text-gray-900">{order.delivery_address}</p>
							</div>
						{/if}
						{#if order.delivery_date}
							<div class="flex items-center gap-2">
								<Calendar class="w-4 h-4 text-gray-400" />
								<div>
									<p class="text-sm text-gray-600 mb-1">{$_('orders.deliveryDate')}</p>
									<p class="text-gray-900">{formatDate(order.delivery_date)}</p>
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- Order Timeline -->
			<Card className="border-0 shadow-md">
				<CardHeader className="border-b border-gray-100 px-6 py-5">
					<CardTitle className="flex items-center gap-2">
						<Clock class="w-5 h-5 text-green-600" />
						{$_('orders.timeline')}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6 space-y-4">
					<div>
						<p class="text-sm text-gray-600 mb-1">{$_('orders.created')}</p>
						<p class="text-gray-900">{formatDate(order.created_at)}</p>
					</div>
					{#if order.accepted_at}
						<div>
							<p class="text-sm text-gray-600 mb-1">{$_('orders.accepted')}</p>
							<p class="text-gray-900">{formatDate(order.accepted_at)}</p>
						</div>
					{/if}
					{#if order.completed_at}
						<div>
							<p class="text-sm text-gray-600 mb-1">{$_('orders.completed')}</p>
							<p class="text-gray-900">{formatDate(order.completed_at)}</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Notes -->
		{#if order.notes}
			<Card className="border-0 shadow-md">
				<CardHeader className="border-b border-gray-100 px-6 py-5">
					<CardTitle className="flex items-center gap-2">
						<FileText class="w-5 h-5 text-green-600" />
						{$_('orders.notes')}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<p class="text-gray-900 whitespace-pre-wrap">{order.notes}</p>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>

