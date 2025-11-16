<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import { Package, Users, ShoppingCart, Link as LinkIcon, TrendingUp, ArrowUpRight, DollarSign, Activity } from 'lucide-svelte';

	const stats = [
		{
			title: 'Total Products',
			value: '45',
			change: '+12%',
			icon: Package,
			color: 'text-green-600',
			bgColor: 'bg-green-50',
			gradient: 'from-green-500 to-green-600',
		},
		{
			title: 'Pending Links',
			value: '8',
			change: '+3 new',
			icon: LinkIcon,
			color: 'text-blue-600',
			bgColor: 'bg-blue-50',
			gradient: 'from-blue-500 to-blue-600',
		},
		{
			title: 'Active Orders',
			value: '12',
			change: '+5 today',
			icon: ShoppingCart,
			color: 'text-purple-600',
			bgColor: 'bg-purple-50',
			gradient: 'from-purple-500 to-purple-600',
		},
		{
			title: 'Connected Buyers',
			value: '23',
			change: '+8%',
			icon: Users,
			color: 'text-orange-600',
			bgColor: 'bg-orange-50',
			gradient: 'from-orange-500 to-orange-600',
		},
	];

	const recentActivity = [
		{ id: 1, text: 'New link request from "Restaurant ABC"', time: '2 hours ago', type: 'link' },
		{ id: 2, text: 'Order #1234 completed', time: '4 hours ago', type: 'order' },
		{ id: 3, text: 'Product "Organic Tomatoes" stock updated', time: '6 hours ago', type: 'product' },
		{ id: 4, text: 'New manager added: Jane Manager', time: '1 day ago', type: 'team' },
	];
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between mb-2">
		<div>
			<h2 class="text-gray-900 mb-2">Dashboard Overview</h2>
			<p class="text-gray-600">Welcome back! Here's what's happening with your supplier business.</p>
		</div>
		<div class="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-xl border border-green-200">
			<Activity class="w-4 h-4 text-green-600" />
			<span class="text-sm text-green-700">All systems operational</span>
		</div>
	</div>

	<!-- Stats Grid -->
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
					<p class="text-sm text-gray-600 mb-1.5">{stat.title}</p>
					<h3 class="text-gray-900">{stat.value}</h3>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Recent Activity -->
		<Card className="lg:col-span-2 border-0 shadow-md">
			<CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
				<CardTitle className="flex items-center gap-2.5">
					<Activity class="w-5 h-5 text-green-600" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				<div class="space-y-1">
					{#each recentActivity as activity, index}
						<div class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group cursor-pointer animate-slide-in" style="animation-delay: {index * 100}ms">
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

		<!-- Quick Stats -->
		<Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
			<CardHeader className="border-b border-green-100 px-6 py-5">
				<CardTitle className="flex items-center gap-2.5">
					<DollarSign class="w-5 h-5 text-green-600" />
					Performance
				</CardTitle>
			</CardHeader>
			<CardContent className="p-6">
				<div class="space-y-6">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">Monthly Revenue</span>
							<span class="text-green-700">$45,230</span>
						</div>
						<div class="h-2.5 bg-green-200 rounded-full overflow-hidden">
							<div class="h-full w-[75%] bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
						</div>
					</div>
					
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">Orders Completed</span>
							<span class="text-gray-900">89/100</span>
						</div>
						<div class="h-2.5 bg-gray-200 rounded-full overflow-hidden">
							<div class="h-full w-[89%] bg-gradient-to-r from-gray-500 to-gray-600 rounded-full"></div>
						</div>
					</div>
					
					<div class="pt-4 border-t border-green-200 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">Avg Order Value</span>
							<span class="text-gray-900">$508</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-700">Growth Rate</span>
							<span class="text-green-700 flex items-center gap-1">
								<TrendingUp class="w-4 h-4" />
								+12%
							</span>
						</div>
					</div>

					<div class="mt-6 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
						<div class="flex items-center gap-3 mb-3">
							<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
								<TrendingUp class="w-5 h-5 text-white" />
							</div>
							<div>
								<p class="text-xs text-gray-600 mb-0.5">This Month</p>
								<p class="text-green-700">↑ 12% increase</p>
							</div>
						</div>
						<p class="text-xs text-gray-600 leading-relaxed">
							Your best month yet! Keep up the great work.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>

