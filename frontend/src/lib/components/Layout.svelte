<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore, user, supplier } from '$lib/stores/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { _ } from 'svelte-i18n';
	import { 
		LogOut, 
		Store, 
		Users, 
		Package, 
		ShoppingCart, 
		Link as LinkIcon,
		Settings,
		LayoutDashboard,
		AlertTriangle,
		AlertCircle
	} from 'lucide-svelte';

	const navigation = [
		{ id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'sales_representative'], path: '/dashboard' },
		{ id: 'links', labelKey: 'nav.links', icon: LinkIcon, roles: ['owner', 'manager', 'sales_representative'], path: '/links' },
		{ id: 'orders', labelKey: 'nav.orders', icon: ShoppingCart, roles: ['owner', 'manager', 'sales_representative'], path: '/orders' },
		{ id: 'catalog', labelKey: 'nav.catalog', icon: Package, roles: ['owner', 'manager', 'sales_representative'], path: '/catalog' },
		{ id: 'complaints', labelKey: 'nav.complaints', icon: AlertTriangle, roles: ['manager', 'owner'], path: '/complaints' },
		{ id: 'incidents', labelKey: 'nav.incidents', icon: AlertCircle, roles: ['manager'], path: '/incidents' },
		{ id: 'team', labelKey: 'nav.team', icon: Users, roles: ['owner', 'manager'], path: '/team' },
		{ id: 'settings', labelKey: 'nav.settings', icon: Settings, roles: ['owner'], path: '/settings' },
	];

	function canAccess(roles: string[]) {
		return $user && roles.includes($user.role);
	}

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
		<div class="px-8 py-5">
			<div class="flex items-center justify-between max-w-[1800px] mx-auto">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-4">
						<div class="relative">
							<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/30">
								<Store class="w-6 h-6 text-white" />
							</div>
							<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
						</div>
						<div>
							<h1 class="text-gray-900 mb-0.5">{$supplier?.name || $_('layout.supplier')}</h1>
							<div class="flex items-center gap-2">
								<span class="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full">
									{#if $user?.role === 'owner'}
										{$_('common.roles.owner')}
									{:else if $user?.role === 'manager'}
										{$_('common.roles.manager')}
									{:else if $user?.role === 'sales_representative'}
										{$_('common.roles.sales_representative')}
									{:else}
										{$user?.role || ''}
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<LanguageSwitcher />
					<div class="text-right mr-2">
						<p class="text-sm text-gray-900 mb-0.5">{$user?.name || ''}</p>
						<p class="text-xs text-gray-500">{$user?.email || ''}</p>
					</div>
					<Button
						variant="outline"
						on:click={handleLogout}
						className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 h-10 px-4"
					>
						<LogOut class="w-4 h-4 mr-2" />
						{$_('nav.logout')}
					</Button>
				</div>
			</div>
		</div>
	</header>

	<div class="flex max-w-[1800px] mx-auto">
		<!-- Sidebar -->
		<aside class="w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-89px)] shadow-sm relative">
			<nav class="p-6 space-y-1.5">
				{#each navigation as item}
					{#if canAccess(item.roles)}
						{@const Icon = item.icon}
						{@const active = $page.url.pathname === item.path}
						<a
							href={item.path}
							data-sveltekit-preload-data="hover"
							class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 {active
								? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-sm'
								: 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'}"
						>
							<div class="p-1.5 rounded-lg {active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
								<Icon class="w-4 h-4" />
							</div>
							<span class={active ? 'font-medium' : ''}>{$_(item.labelKey)}</span>
						</a>
					{/if}
				{/each}
			</nav>
			
		</aside>

		<!-- Main Content -->
		<main class="flex-1 px-10 py-8 animate-fade-in">
			<div class="max-w-[1400px]">
				<slot />
			</div>
		</main>
	</div>
</div>

