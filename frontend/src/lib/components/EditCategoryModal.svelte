<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { categoriesApi } from '$lib/api/categories';
	import type { CategoryResponse } from '$lib/api/categories';

	export let open: boolean = false;
	export let category: CategoryResponse | null = null;

	let categoryName = '';
	let loading = false;
	let error = '';

	function resetForm() {
		if (category) {
			categoryName = category.name;
		} else {
			categoryName = '';
		}
		error = '';
	}

	function handleClose() {
		if (!loading) {
			resetForm();
			open = false;
		}
	}

	async function handleSubmit() {
		if (!category) return;

		if (!categoryName.trim()) {
			error = 'Category name is required';
			return;
		}

		loading = true;
		error = '';

		try {
			await categoriesApi.updateCategory(category.id, {
				name: categoryName.trim(),
			});

			resetForm();
			open = false;
			// Dispatch event to parent to reload categories
			window.dispatchEvent(new CustomEvent('categoryUpdated'));
		} catch (err: any) {
			error = err?.message || 'Failed to update category. Please try again.';
			console.error('Update category error:', err);
		} finally {
			loading = false;
		}
	}

	// Reset form when modal opens or category changes
	$: if (open && category) {
		resetForm();
	}
</script>

<Dialog open={open} title="Edit Category" on:close={handleClose}>
	{#if category}
		<form on:submit|preventDefault={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label htmlFor="categoryName" className="text-gray-700">
					Category Name <span class="text-red-500">*</span>
				</Label>
				<Input
					id="categoryName"
					bind:value={categoryName}
					placeholder="e.g., Fresh Vegetables"
					className="h-10"
					required
					disabled={loading}
				/>
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
					disabled={loading}
				>
					{loading ? 'Updating...' : 'Update Category'}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>

