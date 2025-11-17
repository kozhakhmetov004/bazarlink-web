<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { productsApi, categoriesApi } from '$lib/api';
	import { supplier } from '$lib/stores/auth';
	import type { CategoryResponse } from '$lib/api/categories';

	export let open: boolean = false;

	let productName = '';
	let description = '';
	let sku = '';
	let categoryId: number | null = null;
	let price = '';
	let discountPrice = '';
	let stockQuantity = '';
	let unit = 'kg';
	let minOrderQuantity = '1';
	let imageUrl = '';
	let loading = false;
	let error = '';
	let categories: CategoryResponse[] = [];
	let loadingCategories = false;

	const units = [
		{ value: 'kg', label: 'Kilogram (kg)' },
		{ value: 'g', label: 'Gram (g)' },
		{ value: 'l', label: 'Liter (l)' },
		{ value: 'ml', label: 'Milliliter (ml)' },
		{ value: 'piece', label: 'Piece' },
		{ value: 'box', label: 'Box' },
		{ value: 'pack', label: 'Pack' },
	];

	async function loadCategories() {
		if (!$supplier) return;

		loadingCategories = true;
		try {
			categories = await categoriesApi.getCategories({ supplier_id: parseInt($supplier.id) });
		} catch (err) {
			console.error('Failed to load categories:', err);
		} finally {
			loadingCategories = false;
		}
	}

	function resetForm() {
		productName = '';
		description = '';
		sku = '';
		categoryId = null;
		price = '';
		discountPrice = '';
		stockQuantity = '';
		unit = 'kg';
		minOrderQuantity = '1';
		imageUrl = '';
		error = '';
	}

	function handleClose() {
		if (!loading) {
			resetForm();
			open = false;
		}
	}

	async function handleSubmit() {
		if (!productName.trim()) {
			error = 'Product name is required';
			return;
		}

		if (!categoryId) {
			error = 'Please select a category';
			return;
		}

		if (!price || parseFloat(price) <= 0) {
			error = 'Valid price is required';
			return;
		}

		if (!stockQuantity || parseFloat(stockQuantity) < 0) {
			error = 'Valid stock quantity is required';
			return;
		}

		if (!$supplier) {
			error = 'Supplier not found';
			return;
		}

		loading = true;
		error = '';

		try {
			await productsApi.createProduct({
				name: productName.trim(),
				description: description.trim() || undefined,
				sku: sku.trim() || undefined,
				supplier_id: parseInt($supplier.id),
				category_id: categoryId,
				price: parseFloat(price),
				discount_price: discountPrice ? parseFloat(discountPrice) : undefined,
				stock_quantity: parseFloat(stockQuantity),
				unit: unit,
				min_order_quantity: parseFloat(minOrderQuantity),
				image_url: imageUrl.trim() || undefined,
				is_available: true,
			});

			resetForm();
			open = false;
			// Dispatch event to parent to reload products
			window.dispatchEvent(new CustomEvent('productCreated'));
		} catch (err: any) {
			error = err?.message || 'Failed to create product. Please try again.';
			console.error('Create product error:', err);
		} finally {
			loading = false;
		}
	}

	// Load categories when modal opens
	$: if (open) {
		resetForm();
		loadCategories();
	}
</script>

<Dialog open={open} title="Add Product" on:close={handleClose}>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="space-y-2">
			<Label htmlFor="productName" className="text-gray-700">
				Product Name <span class="text-red-500">*</span>
			</Label>
			<Input
				id="productName"
				bind:value={productName}
				placeholder="e.g., Fresh Tomatoes"
				className="h-10"
				required
				disabled={loading}
			/>
		</div>

		<div class="space-y-2">
			<Label htmlFor="description" className="text-gray-700">Description</Label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Product description..."
				class="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
				disabled={loading}
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label htmlFor="sku" className="text-gray-700">SKU</Label>
				<Input
					id="sku"
					bind:value={sku}
					placeholder="e.g., TOM-001"
					className="h-10"
					disabled={loading}
				/>
			</div>

			<div class="space-y-2">
				<Label htmlFor="category" className="text-gray-700">
					Category <span class="text-red-500">*</span>
				</Label>
				<select
					id="category"
					bind:value={categoryId}
					class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					required
					disabled={loading || loadingCategories}
				>
					<option value="">Select a category</option>
					{#each categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
				{#if loadingCategories}
					<p class="text-xs text-gray-500 mt-1">Loading categories...</p>
				{:else if categories.length === 0}
					<p class="text-xs text-red-500 mt-1">No categories available. Please create a category first.</p>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label htmlFor="price" className="text-gray-700">
					Price <span class="text-red-500">*</span>
				</Label>
				<Input
					id="price"
					type="number"
					step="0.01"
					min="0"
					bind:value={price}
					placeholder="0.00"
					className="h-10"
					required
					disabled={loading}
				/>
			</div>

			<div class="space-y-2">
				<Label htmlFor="discountPrice" className="text-gray-700">Discount Price</Label>
				<Input
					id="discountPrice"
					type="number"
					step="0.01"
					min="0"
					bind:value={discountPrice}
					placeholder="0.00"
					className="h-10"
					disabled={loading}
				/>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-4">
			<div class="space-y-2">
				<Label htmlFor="stockQuantity" className="text-gray-700">
					Stock Quantity <span class="text-red-500">*</span>
				</Label>
				<Input
					id="stockQuantity"
					type="number"
					step="0.01"
					min="0"
					bind:value={stockQuantity}
					placeholder="0"
					className="h-10"
					required
					disabled={loading}
				/>
			</div>

			<div class="space-y-2">
				<Label htmlFor="unit" className="text-gray-700">
					Unit <span class="text-red-500">*</span>
				</Label>
				<select
					id="unit"
					bind:value={unit}
					class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					required
					disabled={loading}
				>
					{#each units as u}
						<option value={u.value}>{u.label}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<Label htmlFor="minOrderQuantity" className="text-gray-700">Min Order Qty</Label>
				<Input
					id="minOrderQuantity"
					type="number"
					step="0.01"
					min="0"
					bind:value={minOrderQuantity}
					placeholder="1"
					className="h-10"
					disabled={loading}
				/>
			</div>
		</div>

		<div class="space-y-2">
			<Label htmlFor="imageUrl" className="text-gray-700">Product Image URL</Label>
			<Input
				id="imageUrl"
				type="url"
				bind:value={imageUrl}
				placeholder="https://example.com/image.jpg"
				className="h-10"
				disabled={loading}
			/>
			<p class="text-xs text-gray-500 mt-1">
				Enter a URL to an image of the product
			</p>
			{#if imageUrl.trim()}
				<div class="mt-2">
					<img
						src={imageUrl}
						alt="Product preview"
						class="w-full h-32 object-cover rounded-md border border-gray-200"
						on:error={(e) => {
							e.currentTarget.style.display = 'none';
						}}
					/>
				</div>
			{/if}
		</div>

		{#if error}
			<Alert variant="destructive">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex gap-3 justify-end pt-2">
			<Button
				type="button"
				variant="outline"
				on:click={handleClose}
				disabled={loading}
			>
				Cancel
			</Button>
			<Button
				type="submit"
				className="bg-green-600 hover:bg-green-700"
				disabled={loading || categories.length === 0}
			>
				{loading ? 'Creating...' : 'Create Product'}
			</Button>
		</div>
	</form>
</Dialog>

