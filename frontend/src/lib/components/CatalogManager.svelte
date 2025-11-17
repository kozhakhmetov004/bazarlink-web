<script lang="ts">
	import { onMount } from 'svelte';
	import { productsApi, categoriesApi } from '$lib/api';
	import { mapProduct } from '$lib/utils/mappers';
	import { supplier, user } from '$lib/stores/auth';
	import type { Product } from '$lib/types';
	import type { CategoryResponse } from '$lib/api/categories';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddCategoryModal from '$lib/components/AddCategoryModal.svelte';
	import AddProductModal from '$lib/components/AddProductModal.svelte';
	import EditCategoryModal from '$lib/components/EditCategoryModal.svelte';
	import EditProductModal from '$lib/components/EditProductModal.svelte';
	import { Plus, Package, Edit } from 'lucide-svelte';
	import type { ProductResponse } from '$lib/api/products';

	$: canManageProducts = $user?.role === 'owner' || $user?.role === 'manager';

	let categories: CategoryResponse[] = [];
	let products: Product[] = [];
	let selectedCategoryId: number | null = null;
	let loading = true;
	let showAddCategoryModal = false;
	let showAddProductModal = false;
	let showEditCategoryModal = false;
	let showEditProductModal = false;
	let editingCategory: CategoryResponse | null = null;
	let editingProduct: ProductResponse | null = null;

	$: filteredProducts = selectedCategoryId 
		? products.filter(p => p.categoryId === String(selectedCategoryId))
		: products;

	onMount(async () => {
		await Promise.all([loadCategories(), loadProducts()]);
		
		// Listen for category/product creation/update events
		window.addEventListener('categoryCreated', handleCategoryCreated);
		window.addEventListener('categoryUpdated', handleCategoryCreated);
		window.addEventListener('productCreated', handleProductCreated);
		window.addEventListener('productUpdated', handleProductCreated);
	});

	async function loadCategories() {
		if (!$supplier) return;
		
		try {
			categories = await categoriesApi.getCategories({ supplier_id: parseInt($supplier.id) });
		} catch (error) {
			console.error('Failed to load categories', error);
		}
	}

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

	async function handleCategoryCreated() {
		await loadCategories();
	}

	async function handleProductCreated() {
		await loadProducts();
	}

	async function handleEditCategory(category: CategoryResponse, event: MouseEvent) {
		event.stopPropagation();
		editingCategory = category;
		showEditCategoryModal = true;
	}

	async function handleEditProduct(product: Product) {
		// Fetch full product data from API
		try {
			const productData = await productsApi.getProduct(parseInt(product.id));
			editingProduct = productData;
			showEditProductModal = true;
		} catch (error) {
			console.error('Failed to load product for editing:', error);
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Catalog Management</h2>
		<p class="text-gray-600">
			{#if canManageProducts}
				Manage your product categories and inventory
			{:else}
				View your product catalog
			{/if}
		</p>
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
					{#if canManageProducts}
						<Button 
							variant="outline" 
							size="sm"
							on:click={() => showAddCategoryModal = true}
						>
							<Plus class="w-4 h-4" />
						</Button>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					<button
						type="button"
						class="w-full text-left px-4 py-2 rounded-lg transition-colors cursor-pointer {!selectedCategoryId ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}"
						on:click={() => selectedCategoryId = null}
					>
						All Products ({products.length})
					</button>
					{#each categories as category}
						{@const productCount = products.filter(p => p.categoryId === String(category.id)).length}
						<div
							class="group flex items-center gap-2 w-full px-4 py-2 rounded-lg transition-colors {selectedCategoryId === category.id ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}"
						>
							<button
								type="button"
								class="flex-1 text-left cursor-pointer"
								on:click={() => selectedCategoryId = category.id}
							>
								<div class="flex items-center justify-between">
									<span class="flex-1">{category.name}</span>
									<span class="text-xs text-gray-500 ml-2">({productCount})</span>
								</div>
							</button>
							{#if canManageProducts}
								<button
									type="button"
									class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
									on:click={(e) => handleEditCategory(category, e)}
									title="Edit category"
								>
									<Edit class="w-4 h-4 text-gray-600" />
								</button>
							{/if}
						</div>
					{/each}
					{#if categories.length === 0 && !loading}
						<p class="text-xs text-gray-500 text-center py-2">
							{#if canManageProducts}
								No categories yet. Click + to add one.
							{:else}
								No categories available.
							{/if}
						</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Products -->
		<Card className="lg:col-span-2">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Products ({filteredProducts.length})</CardTitle>
					{#if canManageProducts}
						<Button 
							variant="default"
							size="sm"
							className="bg-green-600 hover:bg-green-700"
							on:click={() => showAddProductModal = true}
							disabled={categories.length === 0}
						>
							<Plus class="w-4 h-4 mr-2" />
							Add Product
						</Button>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				{#if loading}
					<p class="text-gray-500 text-center py-8">Loading products...</p>
				{:else if filteredProducts.length === 0}
					<p class="text-gray-500 text-center py-8">No products found</p>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each filteredProducts as product}
							<div class="group border border-gray-200 rounded-lg overflow-hidden hover:border-green-300 transition-colors bg-white relative">
								<!-- Image container with fixed height -->
								<div class="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
									{#if product.imageUrl}
										<img
											src={product.imageUrl}
											alt={product.name}
											class="w-full h-full object-cover"
											on:error={(e) => {
												// Show placeholder if image fails to load
												e.currentTarget.style.display = 'none';
												const placeholder = e.currentTarget.nextElementSibling;
												if (placeholder) {
													placeholder.style.display = 'flex';
												}
											}}
										/>
									{/if}
									<!-- Placeholder image -->
									<div
										class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 {product.imageUrl ? 'hidden' : ''}"
										style={product.imageUrl ? 'display: none;' : ''}
									>
										<Package class="w-16 h-16 text-gray-400" />
									</div>
								</div>
								{#if canManageProducts}
									<button
										type="button"
										class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-opacity z-10"
										on:click={() => handleEditProduct(product)}
										title="Edit product"
									>
										<Edit class="w-4 h-4 text-gray-600" />
									</button>
								{/if}
								<div class="p-4">
									<div class="flex items-start justify-between mb-2">
										<h4 class="text-gray-900 font-medium flex-1">{product.name}</h4>
										{#if product.sku}
											<span class="text-xs text-gray-400 ml-2">SKU: {product.sku}</span>
										{/if}
									</div>
									{#if product.description}
										<p class="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
									{/if}
									
									<!-- Pricing Section -->
									<div class="mb-3">
										<div class="flex items-center gap-2 mb-1">
											{#if product.discountPrice}
												<span class="text-lg text-green-700 font-bold">
													{product.currency} {product.price.toFixed(2)}/{product.unit}
												</span>
												<span class="text-xs text-gray-400 line-through">
													{product.currency} {product.originalPrice.toFixed(2)}
												</span>
												<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
													-{product.discount.toFixed(0)}%
												</span>
											{:else}
												<span class="text-lg text-green-700 font-bold">
													{product.currency} {product.price.toFixed(2)}/{product.unit}
												</span>
											{/if}
										</div>
									</div>

									<!-- Product Details -->
									<div class="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
										<div class="flex items-center justify-between">
											<span class="text-gray-500">Stock:</span>
											<span class="font-medium {product.stock > 0 ? 'text-green-600' : 'text-red-600'}">
												{product.stock.toFixed(2)} {product.unit}
											</span>
										</div>
										{#if product.minOrderQuantity}
											<div class="flex items-center justify-between">
												<span class="text-gray-500">Min Order:</span>
												<span class="font-medium text-gray-700">
													{product.minOrderQuantity.toFixed(2)} {product.unit}
												</span>
											</div>
										{/if}
										<div class="flex items-center justify-between">
											<span class="text-gray-500">Lead Time:</span>
											<span class="font-medium text-gray-700">{product.leadTime}</span>
										</div>
										<div class="flex items-center justify-between pt-1">
											<div class="flex items-center gap-2">
												{#if product.deliveryAvailable}
													<span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
														Delivery
													</span>
												{/if}
												{#if product.pickupAvailable}
													<span class="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">
														Pickup
													</span>
												{/if}
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	{#if canManageProducts}
		<AddCategoryModal bind:open={showAddCategoryModal} />
		<AddProductModal bind:open={showAddProductModal} />
		<EditCategoryModal bind:open={showEditCategoryModal} category={editingCategory} />
		<EditProductModal bind:open={showEditProductModal} product={editingProduct} />
	{/if}
</div>

