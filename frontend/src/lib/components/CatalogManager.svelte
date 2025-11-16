<script lang="ts">
	import { onMount } from 'svelte';
	import { productsApi } from '$lib/api';
	import { mapProduct } from '$lib/utils/mappers';
	import { supplier } from '$lib/stores/auth';
	import type { Category, Product } from '$lib/types';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import { Plus, Package } from 'lucide-svelte';

	let categories: Category[] = [];
	let products: Product[] = [];
	let selectedCategory: string | null = null;
	let loading = true;

	$: filteredProducts = selectedCategory 
		? products.filter(p => p.categoryId === selectedCategory)
		: products;

	// Extract unique categories from products
	$: {
		const categoryMap = new Map<string, Category>();
		products.forEach(product => {
			if (product.categoryId && !categoryMap.has(product.categoryId)) {
				categoryMap.set(product.categoryId, {
					id: product.categoryId,
					name: product.categoryId,
					description: '',
					supplierId: product.supplierId,
				});
			}
		});
		categories = Array.from(categoryMap.values());
	}

	onMount(async () => {
		await loadProducts();
	});

	async function loadProducts() {
		try {
			loading = true;
			const supplierId = $supplier?.id;
			if (supplierId) {
				const productsData = await productsApi.getProducts({ supplier_id: parseInt(supplierId) });
				products = productsData.map(mapProduct);
			}
		} catch (error) {
			console.error('Failed to load products', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Catalog Management</h2>
		<p class="text-gray-600">Manage your product categories and inventory</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Categories -->
		<Card className="lg:col-span-1">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Package class="w-5 h-5 text-green-600" />
						Categories
					</CardTitle>
					<Button variant="outline" size="sm">
						<Plus class="w-4 h-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					<button
						class="w-full text-left px-4 py-2 rounded-lg {!selectedCategory ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}"
						onclick={() => selectedCategory = null}
					>
						All Products
					</button>
					{#each categories as category}
						<button
							class="w-full text-left px-4 py-2 rounded-lg {selectedCategory === category.id ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}"
							onclick={() => selectedCategory = category.id}
						>
							{category.name}
						</button>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Products -->
		<Card className="lg:col-span-2">
			<CardHeader>
				<CardTitle>Products ({filteredProducts.length})</CardTitle>
			</CardHeader>
			<CardContent>
				{#if loading}
					<p class="text-gray-500 text-center py-8">Loading products...</p>
				{:else if filteredProducts.length === 0}
					<p class="text-gray-500 text-center py-8">No products found</p>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each filteredProducts as product}
							<div class="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
								<h4 class="text-gray-900 mb-2">{product.name}</h4>
								<p class="text-sm text-gray-600 mb-3">{product.description}</p>
								<div class="flex items-center justify-between">
									<span class="text-green-700 font-semibold">${product.price.toFixed(2)}/{product.unit}</span>
									<span class="text-sm text-gray-500">Stock: {product.stock}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

