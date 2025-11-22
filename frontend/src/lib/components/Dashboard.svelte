<script lang="ts">
	import { user, supplier } from '$lib/stores/auth';
	import { productsApi } from '$lib/api/products';
	import { ordersApi } from '$lib/api/orders';
	import { linksApi } from '$lib/api/links';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import { _ } from 'svelte-i18n';
	import { Package, Users, ShoppingCart, Link as LinkIcon, TrendingUp, ArrowUpRight, DollarSign, Activity } from 'lucide-svelte';
	import { onMount } from 'svelte';

	$: canViewAnalytics = $user?.role === 'owner' || $user?.role === 'manager';

	// Stats data
	let totalProducts = 0;
	let pendingLinks = 0;
	let activeOrders = 0;
	let connectedBuyers = 0;
	let newActiveOrdersToday = 0;
	let loading = true;

	// Performance metrics
	let monthlyRevenue = 0;
	let completedOrdersCount = 0;
	let avgOrderValue = 0;
	let growthRate = 0;
	const monthlyGoal = 300000; // 300,000 KZT goal

	// Previous month metrics for growth calculation
	let previousMonthRevenue = 0;
	let previousMonthCompletedOrders = 0;

	// Previous values for calculating changes (stored in localStorage)
	let previousStats: {
		totalProducts?: number;
		pendingLinks?: number;
		activeOrders?: number;
		connectedBuyers?: number;
		timestamp?: number;
	} = {};

	// Load previous stats from localStorage
	function loadPreviousStats() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('dashboardStats');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					// Only use stats if they're less than 24 hours old
					const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
					if (parsed.timestamp && parsed.timestamp > dayAgo) {
						previousStats = parsed;
					}
				} catch (e) {
					console.error('Failed to parse previous stats:', e);
				}
			}
		}
	}

	// Format change indicator
	function getChange(current: number, previous: number | undefined, showPercent: boolean = false): string {
		if (previous === undefined) {
			return '+0';
		}
		
		const diff = current - previous;
		
		if (showPercent) {
			if (previous === 0) {
				return current > 0 ? '+100%' : '0%';
			}
			const percent = Math.round((diff / previous) * 100);
			return percent >= 0 ? `+${percent}%` : `${percent}%`;
		} else {
			if (diff === 0) return '0';
			return diff > 0 ? `+${diff}` : `${diff}`;
		}
	}

	async function loadDashboardData() {
		if (!$supplier?.id || !canViewAnalytics) {
			loading = false;
			return;
		}

		// Load previous stats before fetching new ones
		loadPreviousStats();

		loading = true;
		const supplierId = parseInt($supplier.id);

		try {
			// Fetch all data in parallel
			const [products, links, orders] = await Promise.all([
				productsApi.getProducts({ supplier_id: supplierId }),
				linksApi.getLinks({ supplier_id: supplierId }),
				ordersApi.getOrders({ supplier_id: supplierId })
			]);

			// Calculate stats
			totalProducts = products.length;
			
			// Pending links
			pendingLinks = links.filter(link => link.status === 'pending').length;
			
			// Active orders (pending or accepted)
			activeOrders = orders.filter(order => 
				order.status === 'pending' || order.status === 'accepted'
			).length;
			
			// Calculate new active orders today (orders created today with pending/accepted status)
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			newActiveOrdersToday = orders.filter(order => {
				const orderDate = new Date(order.created_at);
				orderDate.setHours(0, 0, 0, 0);
				return (order.status === 'pending' || order.status === 'accepted') && 
					   orderDate.getTime() === today.getTime();
			}).length;
			
			// Connected buyers (accepted links)
			connectedBuyers = links.filter(link => link.status === 'accepted').length;

			// Calculate performance metrics from orders
			const now = new Date();
			const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

			// Current month orders (completed)
			const currentMonthCompleted = orders.filter(order => {
				if (order.status !== 'completed') return false;
				const orderDate = new Date(order.completed_at || order.created_at);
				return orderDate >= currentMonthStart;
			});

			// Previous month orders (completed)
			const previousMonthCompleted = orders.filter(order => {
				if (order.status !== 'completed') return false;
				const orderDate = new Date(order.completed_at || order.created_at);
				return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
			});

			// Calculate revenue (sum of completed orders totals, convert to KZT if needed)
			monthlyRevenue = currentMonthCompleted.reduce((sum, order) => {
				// Order total is already a number
				return sum + order.total;
			}, 0);

			previousMonthRevenue = previousMonthCompleted.reduce((sum, order) => {
				return sum + order.total;
			}, 0);

			completedOrdersCount = currentMonthCompleted.length;
			previousMonthCompletedOrders = previousMonthCompleted.length;

			// Calculate average order value
			avgOrderValue = completedOrdersCount > 0 
				? monthlyRevenue / completedOrdersCount 
				: 0;

			// Calculate growth rate (compare revenue)
			if (previousMonthRevenue > 0) {
				growthRate = Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
			} else if (monthlyRevenue > 0) {
				growthRate = 100; // 100% growth if no previous data
			} else {
				growthRate = 0;
			}

			// Save current stats to localStorage for next time (save after a delay so change calculation uses old values)
			setTimeout(() => {
				if (typeof window !== 'undefined') {
					const statsToSave = {
						totalProducts,
						pendingLinks,
						activeOrders,
						connectedBuyers,
						monthlyRevenue,
						completedOrdersCount,
						avgOrderValue,
						growthRate,
						timestamp: Date.now()
					};
					localStorage.setItem('dashboardStats', JSON.stringify(statsToSave));
				}
			}, 100);

		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			loading = false;
		}
	}

	$: stats = [
		{
			titleKey: 'dashboard.totalProducts',
			value: loading ? '...' : totalProducts.toString(),
			change: loading ? '...' : getChange(totalProducts, previousStats.totalProducts, true),
			icon: Package,
			color: 'text-green-600',
			bgColor: 'bg-green-50',
			gradient: 'from-green-500 to-green-600',
		},
		{
			titleKey: 'dashboard.pendingLinks',
			value: loading ? '...' : pendingLinks.toString(),
			change: loading ? '...' : getChange(pendingLinks, previousStats.pendingLinks) + ' new',
			icon: LinkIcon,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			gradient: 'from-blue-500 to-blue-600',
		},
		{
			titleKey: 'dashboard.activeOrders',
			value: loading ? '...' : activeOrders.toString(),
			change: loading ? '...' : (newActiveOrdersToday > 0 ? `+${newActiveOrdersToday} today` : '0 today'),
			icon: ShoppingCart,
			color: 'text-purple-600',
			bgColor: 'bg-purple-50',
			gradient: 'from-purple-500 to-purple-600',
		},
		{
			titleKey: 'dashboard.connectedBuyers',
			value: loading ? '...' : connectedBuyers.toString(),
			change: loading ? '...' : getChange(connectedBuyers, previousStats.connectedBuyers, true),
			icon: Users,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50',
			gradient: 'from-orange-500 to-orange-600',
		},
	];

	// Generate recent activity from real data
	let recentActivity: Array<{ id: number; text: string; time: string; type: string; orderId?: number }> = [];

	async function loadRecentActivity() {
		if (!$supplier?.id) return;

		const supplierId = parseInt($supplier.id);
		const activities: Array<{ id: number; text: string; time: string; type: string; timestamp: number; orderId?: number }> = [];

		try {
			const [links, orders] = await Promise.all([
				linksApi.getLinks({ supplier_id: supplierId, status: 'pending' }),
				ordersApi.getOrders({ supplier_id: supplierId })
			]);

			// Add pending link requests
			links.slice(0, 5).forEach((link, index) => {
				activities.push({
					id: link.id,
					text: `New link request (ID: ${link.id})`,
					time: formatTimeAgo(new Date(link.requested_at)),
					type: 'link',
					timestamp: new Date(link.requested_at).getTime()
				});
			});

			// Add recent orders
			orders.slice(0, 5).forEach((order) => {
				const statusText = order.status === 'completed' ? 'completed' : 
								  order.status === 'accepted' ? 'accepted' :
								  order.status === 'pending' ? 'pending' :
								  order.status;
				activities.push({
					id: order.id,
					text: `Order #${order.order_number} ${statusText}`,
					time: formatTimeAgo(new Date(order.created_at)),
					type: 'order',
					orderId: order.id, // Store order ID for navigation
					timestamp: new Date(order.created_at).getTime()
				});
			});

			// Sort by timestamp (newest first) and take top 4
			recentActivity = activities
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, 4)
				.map(({ timestamp, ...rest }) => rest);

		} catch (error) {
			console.error('Failed to load recent activity:', error);
		}
	}

	function handleActivityClick(activity: { type: string; id?: number; orderId?: number }) {
		if (activity.type === 'order' && activity.orderId) {
			goto(`/orders/${activity.orderId}`);
		}
	}

	function formatCurrency(amount: number, currency: string = 'KZT'): string {
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	function formatTimeAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
		if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
		if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
		return date.toLocaleDateString();
	}

	onMount(() => {
		loadDashboardData();
		loadRecentActivity();
	});

	// Reload when supplier changes
	$: if ($supplier?.id && canViewAnalytics) {
		loadDashboardData();
		loadRecentActivity();
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between mb-2">
		<div>
			<h2 class="text-gray-900 mb-2">{$_('dashboard.title')}</h2>
			<p class="text-gray-600">{$_('dashboard.welcome')}</p>
		</div>
		<div class="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-200">
			<Activity class="w-4 h-4 text-green-600" />
			<span class="text-sm text-green-700">{$_('dashboard.allSystemsOperational')}</span>
		</div>
	</div>

	<!-- Stats Grid (Analytics - Owner/Manager only) -->
	{#if canViewAnalytics}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
			{#each stats as stat}
				{@const Icon = stat.icon}
				<Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
					<div class="absolute inset-0 bg-gradient-to-br {stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
					<CardContent className="p-6 relative">
						<div class="flex items-start justify-between mb-6">
							<div class="p-3 rounded-xl {stat.bgColor} group-hover:scale-110 transition-transform duration-300">
								<Icon class="w-6 h-6 {stat.color}" />
							</div>
							<div class="flex items-center gap-1 text-green-600 text-xs px-2 py-1 bg-green-50 rounded-full">
								<TrendingUp class="w-3 h-3" />
								<span>{stat.change}</span>
							</div>
						</div>
						<p class="text-sm text-gray-600 mb-1.5">{$_(stat.titleKey)}</p>
						<h3 class="text-gray-900">{stat.value}</h3>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Recent Activity -->
		<Card className="lg:col-span-2 border-0 shadow-md">
			<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
				<CardTitle className="flex items-center gap-2.5">
					<Activity class="w-5 h-5 text-green-600" />
					{$_('dashboard.recentActivity')}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				<div class="space-y-1">
					{#each recentActivity as activity, index}
						<div 
							class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group cursor-pointer animate-slide-in {activity.type === 'order' ? 'cursor-pointer' : ''}" 
							style="animation-delay: {index * 100}ms"
							on:click={() => handleActivityClick(activity)}
							role={activity.type === 'order' ? 'button' : undefined}
						>
							<div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 mt-0.5">
								<div class="w-2.5 h-2.5 rounded-full bg-green-600"></div>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-gray-900 group-hover:text-green-700 transition-colors leading-relaxed">{activity.text}</p>
								<p class="text-xs text-gray-500 mt-1.5">{activity.time}</p>
							</div>
							<ArrowUpRight class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Quick Stats (Analytics - Owner/Manager only) -->
		{#if canViewAnalytics}
			<Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
				<CardHeader className="border-b border-green-100 px-6 py-5">
				<CardTitle className="flex items-center gap-2.5">
					<DollarSign class="w-5 h-5 text-green-600" />
					{$_('dashboard.performance')}
				</CardTitle>
				</CardHeader>
				<CardContent className="p-6">
					<div class="space-y-6">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700">{$_('dashboard.monthlyRevenue')}</span>
								<span class="text-green-700">{loading ? '...' : formatCurrency(monthlyRevenue)}</span>
							</div>
							<div class="h-2.5 bg-green-200 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300" 
									style="width: {loading ? '0%' : Math.min((monthlyRevenue / monthlyGoal) * 100, 100) + '%'}"
								></div>
							</div>
							<p class="text-xs text-gray-500 text-right">
								{loading ? '' : `${formatCurrency(monthlyRevenue)} / ${formatCurrency(monthlyGoal)}`}
							</p>
						</div>
						
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700">{$_('dashboard.ordersCompleted')}</span>
								<span class="text-gray-900">{loading ? '...' : `${completedOrdersCount}/100`}</span>
							</div>
							<div class="h-2.5 bg-gray-200 rounded-full overflow-hidden">
								<div 
									class="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full transition-all duration-300" 
									style="width: {loading ? '0%' : Math.min((completedOrdersCount / 100) * 100, 100) + '%'}"
								></div>
							</div>
						</div>
						
						<div class="pt-4 border-t border-green-200 space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700">{$_('dashboard.avgOrderValue')}</span>
								<span class="text-gray-900">{loading ? '...' : formatCurrency(avgOrderValue)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-700">{$_('dashboard.growthRate')}</span>
								<span class="text-green-700 flex items-center gap-1">
									<TrendingUp class="w-4 h-4" />
									{loading ? '...' : (growthRate >= 0 ? '+' : '') + growthRate + '%'}
								</span>
							</div>
						</div>

						{#if !loading && growthRate > 0}
							<div class="mt-6 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
								<div class="flex items-center gap-3 mb-3">
									<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
										<TrendingUp class="w-5 h-5 text-white" />
									</div>
									<div>
										<p class="text-xs text-gray-600 mb-0.5">{$_('dashboard.thisMonth')}</p>
										<p class="text-green-700">↑ {growthRate}% {$_('dashboard.increase')}</p>
									</div>
								</div>
								<p class="text-xs text-gray-600 leading-relaxed">
									{$_('dashboard.bestMonth')}
								</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

