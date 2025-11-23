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
	import { Plus, Package, Edit, Search, Trash2 } from 'lucide-svelte';
	import { _ } from 'svelte-i18n';
	import type { ProductResponse } from '$lib/api/products';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';

	$: canManageProducts = $user?.role === 'owner' || $user?.role === 'manager';

	let categories: CategoryResponse[] = [];
	let products: Product[] = [];
	let selectedCategoryId: number | null = null;
	let searchTerm = '';
	let loading = true;
	let showAddCategoryModal = false;
	let showAddProductModal = false;
	let showEditCategoryModal = false;
	let showEditProductModal = false;
	let editingCategory: CategoryResponse | null = null;
	let editingProduct: ProductResponse | null = null;
	let showDeleteCategoryDialog = false;
	let showDeleteProductDialog = false;
	let deletingCategory: CategoryResponse | null = null;
	let deletingProduct: Product | null = null;
	let deleteError = '';

	$: filteredProducts = (() => {
		let filtered = selectedCategoryId 
			? products.filter(p => p.categoryId === String(selectedCategoryId))
			: products;
		
		// Filter by search term if provided
		if (searchTerm.trim()) {
			const term = searchTerm.trim().toLowerCase();
			filtered = filtered.filter(p => 
				p.name.toLowerCase().includes(term)
			);
		}
		
		return filtered;
	})();

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
				// Pass supplier data to mapProduct for delivery info
				const supplierData = $supplier ? {
					delivery_available: ($supplier as any).delivery_available,
					pickup_available: ($supplier as any).pickup_available,
					lead_time_days: ($supplier as any).lead_time_days
				} : undefined;
				products = productsData.map(p => mapProduct(p, supplierData));
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

	async function handleDeleteCategory(category: CategoryResponse, event: MouseEvent) {
		event.stopPropagation();
		
		deletingCategory = category;
		showDeleteCategoryDialog = true;
		
		// Check if category has products
		const categoryProducts = products.filter(p => p.categoryId === String(category.id));
		if (categoryProducts.length > 0) {
			deleteError = $_('catalog.categoryHasProducts').replace('{count}', categoryProducts.length.toString());
		} else {
			deleteError = '';
		}
	}

	async function confirmDeleteCategory() {
		if (!deletingCategory) return;
		
		// Check if category has products - prevent deletion if it does
		const categoryProducts = products.filter(p => p.categoryId === String(deletingCategory.id));
		if (categoryProducts.length > 0) {
			deleteError = $_('catalog.categoryHasProducts').replace('{count}', categoryProducts.length.toString());
			return;
		}
		
		try {
			await categoriesApi.deleteCategory(deletingCategory.id);
			// Reload categories and products
			await Promise.all([loadCategories(), loadProducts()]);
			
			// Clear selection if deleted category was selected
			if (selectedCategoryId === deletingCategory.id) {
				selectedCategoryId = null;
			}
			
			showDeleteCategoryDialog = false;
			deletingCategory = null;
			deleteError = '';
		} catch (error: any) {
			deleteError = error?.message || $_('catalog.failedToDeleteCategory');
			console.error('Failed to delete category:', error);
		}
	}

	async function handleDeleteProduct(product: Product, event: MouseEvent) {
		event.stopPropagation();
		deletingProduct = product;
		showDeleteProductDialog = true;
		deleteError = '';
	}

	async function confirmDeleteProduct() {
		if (!deletingProduct) return;
		
		try {
			await productsApi.deleteProduct(parseInt(deletingProduct.id));
			// Reload products
			await loadProducts();
			
			showDeleteProductDialog = false;
			deletingProduct = null;
			deleteError = '';
		} catch (error: any) {
			deleteError = error?.message || $_('catalog.failedToDeleteProduct');
			console.error('Failed to delete product:', error);
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">{$_('catalog.title')}</h2>
		<p class="text-gray-600">{$_('catalog.description')}</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Categories -->
		<Card className="lg:col-span-1">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Package class="w-5 h-5 text-green-600" />
						{$_('catalog.categories')}
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
						{$_('catalog.allCategories')} ({products.length})
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
								<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										type="button"
										class="p-1 rounded hover:bg-gray-200 transition-colors"
										on:click={(e) => handleEditCategory(category, e)}
										title={$_('catalog.editCategory')}
									>
										<Edit class="w-4 h-4 text-gray-600" />
									</button>
									<button
										type="button"
										class="p-1 rounded hover:bg-red-100 transition-colors"
										on:click={(e) => handleDeleteCategory(category, e)}
										title={$_('catalog.deleteCategory')}
									>
										<Trash2 class="w-4 h-4 text-red-600" />
									</button>
								</div>
							{/if}
						</div>
					{/each}
					{#if categories.length === 0 && !loading}
						<p class="text-xs text-gray-500 text-center py-2">
							{#if canManageProducts}
								{$_('catalog.noCategories')}
							{:else}
								{$_('catalog.noCategoriesAvailable')}
							{/if}
						</p>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Products -->
		<Card className="lg:col-span-2">
			<CardHeader>
				<div class="flex items-center justify-between mb-4">
					<CardTitle>{$_('catalog.products')} ({filteredProducts.length})</CardTitle>
					{#if canManageProducts}
						<Button 
							variant="default"
							size="sm"
							className="bg-green-600 hover:bg-green-700"
							on:click={() => showAddProductModal = true}
							disabled={categories.length === 0}
						>
							<Plus class="w-4 h-4 mr-2" />
							{$_('catalog.addProduct')}
						</Button>
					{/if}
				</div>
				<!-- Search Input -->
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						bind:value={searchTerm}
						placeholder={$_('catalog.searchPlaceholder')}
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					/>
				</div>
			</CardHeader>
			<CardContent>
				{#if loading}
					<p class="text-gray-500 text-center py-8">{$_('catalog.loadingProducts')}</p>
				{:else if filteredProducts.length === 0}
					<p class="text-gray-500 text-center py-8">{$_('catalog.noProducts')}</p>
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
									<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity z-10">
										<button
											type="button"
											class="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
											on:click={() => handleEditProduct(product)}
											title={$_('catalog.editProduct')}
										>
											<Edit class="w-4 h-4 text-gray-600" />
										</button>
										<button
											type="button"
											class="p-2 rounded-full bg-white shadow-md hover:bg-red-50 transition-colors"
											on:click={(e) => handleDeleteProduct(product, e)}
											title={$_('catalog.deleteProduct')}
										>
											<Trash2 class="w-4 h-4 text-red-600" />
										</button>
									</div>
								{/if}
								<div class="p-4">
									<div class="flex items-start justify-between mb-2">
										<h4 class="text-gray-900 font-medium flex-1">{product.name}</h4>
										{#if product.sku}
											<span class="text-xs text-gray-400 ml-2">{$_('catalog.sku')}: {product.sku}</span>
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
											<span class="text-gray-500">{$_('catalog.stock')}:</span>
											<span class="font-medium {product.stock > 0 ? 'text-green-600' : 'text-red-600'}">
												{product.stock.toFixed(2)} {product.unit}
											</span>
										</div>
										{#if product.minOrderQuantity}
											<div class="flex items-center justify-between">
												<span class="text-gray-500">{$_('catalog.minOrder')}:</span>
												<span class="font-medium text-gray-700">
													{product.minOrderQuantity.toFixed(2)} {product.unit}
												</span>
											</div>
										{/if}
										<div class="flex items-center justify-between">
											<span class="text-gray-500">{$_('catalog.leadTime')}:</span>
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

	<!-- Delete Category Dialog -->
	<Dialog open={showDeleteCategoryDialog} title={$_('catalog.deleteCategoryTitle')} on:close={() => { showDeleteCategoryDialog = false; deletingCategory = null; deleteError = ''; }}>
		<div class="space-y-4">
			{#if deleteError}
				<Alert variant="destructive">
					<AlertDescription>{deleteError}</AlertDescription>
				</Alert>
			{:else}
				<p class="text-gray-700">
					{$_('catalog.confirmDeleteCategory')}
				</p>
				{#if deletingCategory}
					<p class="text-sm font-medium text-gray-900">
						{deletingCategory.name}
					</p>
				{/if}
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button
					variant="outline"
					on:click={() => { showDeleteCategoryDialog = false; deletingCategory = null; deleteError = ''; }}
				>
					{$_('common.cancel')}
				</Button>
				{#if !deleteError}
					<Button
						variant="default"
						className="bg-red-600 hover:bg-red-700"
						on:click={confirmDeleteCategory}
					>
						{$_('common.delete')}
					</Button>
				{/if}
			</div>
		</div>
	</Dialog>

	<!-- Delete Product Dialog -->
	<Dialog open={showDeleteProductDialog} title={$_('catalog.deleteProductTitle')} on:close={() => { showDeleteProductDialog = false; deletingProduct = null; deleteError = ''; }}>
		<div class="space-y-4">
			{#if deleteError}
				<Alert variant="destructive">
					<AlertDescription>{deleteError}</AlertDescription>
				</Alert>
			{/if}
			<p class="text-gray-700">
				{$_('catalog.confirmDeleteProduct')}
			</p>
			{#if deletingProduct}
				<p class="text-sm font-medium text-gray-900">
					{deletingProduct.name}
				</p>
			{/if}
			<div class="flex items-center justify-end gap-3 pt-4">
				<Button
					variant="outline"
					on:click={() => { showDeleteProductDialog = false; deletingProduct = null; deleteError = ''; }}
				>
					{$_('common.cancel')}
				</Button>
				<Button
					variant="default"
					className="bg-red-600 hover:bg-red-700"
					on:click={confirmDeleteProduct}
				>
					{$_('common.delete')}
				</Button>
			</div>
		</div>
	</Dialog>
</div>

