<script lang="ts">
	import { supplier, authStore, user } from '$lib/stores/auth';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import AddTeamMemberModal from '$lib/components/AddTeamMemberModal.svelte';
	import { Settings, Users, Plus, Building2, CheckCircle2, PlusCircle, Edit } from 'lucide-svelte';
	import { usersApi } from '$lib/api/users';
	import { suppliersApi } from '$lib/api/suppliers';
	import { mapSupplier, mapUser } from '$lib/utils/mappers';
	import { authApi } from '$lib/api/auth';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { UserResponse } from '$lib/api/users';

	let showAddMemberModal = false;
	let teamMembers: UserResponse[] = [];
	let loadingMembers = false;

	// Supplier form fields
	let companyName = $supplier?.name || '';
	let legalName = '';
	let email = $supplier?.contactEmail || $user?.email || '';
	let phone = $supplier?.contactPhone || '';
	let address = $supplier?.address || '';
	let city = '';
	let country = 'KZ';
	let description = $supplier?.description || '';
	let website = '';
	
	// Email is always the owner's email and not editable
	$: email = $user?.email || '';
	
	let loading = false;
	let error = '';
	let success = '';

	// Update form fields when supplier changes
	$: if ($supplier) {
		companyName = $supplier.name || '';
		phone = $supplier.contactPhone || '';
		address = $supplier.address || '';
		description = $supplier.description || '';
	}

	$: hasSupplier = !!$supplier;
	$: isOwner = $user?.role === 'owner';
	
	// Debug: log supplier state
	$: if (isOwner) {
		console.log('SettingsManager - User:', $user?.email, 'Supplier:', $supplier?.name || 'none', 'hasSupplier:', hasSupplier);
	}

	async function handleSave() {
		error = '';
		success = '';
		loading = true;

		try {
			if (hasSupplier) {
				// Update existing supplier
				const supplierId = parseInt($supplier!.id);
				await suppliersApi.updateSupplier(supplierId, {
					company_name: companyName,
					legal_name: legalName || undefined,
					email,
					phone: phone || undefined,
					address: address || undefined,
					city: city || undefined,
					description: description || undefined,
					website: website || undefined,
				});

				// Refresh supplier data
				const updatedSupplier = await suppliersApi.getSupplier(supplierId);
				const mappedSupplier = mapSupplier(updatedSupplier);
				mappedSupplier.ownerId = $user!.id;
				
				authStore.updateSupplier({
					name: mappedSupplier.name,
					description: mappedSupplier.description,
					contactEmail: mappedSupplier.contactEmail,
					contactPhone: mappedSupplier.contactPhone,
					address: mappedSupplier.address
				});

				success = 'Supplier information updated successfully!';
			} else {
				// Create new supplier (backend will automatically link it to owner)
				const newSupplier = await suppliersApi.createSupplier({
					company_name: companyName,
					legal_name: legalName || undefined,
					email: $user!.email, // Use owner's email
					phone: phone || undefined,
					address: address || undefined,
					city: city || undefined,
					country: country || 'KZ',
					description: description || undefined,
					website: website || undefined,
				});

				// Refresh auth store to get updated user with supplier_id
				await authStore.refresh();

				success = 'Supplier created successfully!';
			}
		} catch (err: any) {
			error = err?.message || 'Failed to save supplier information. Please try again.';
			console.error('Supplier save error:', err);
		} finally {
			loading = false;
		}
	}

	async function loadTeamMembers() {
		if ($user?.role !== 'owner') return;
		
		loadingMembers = true;
		try {
			const users = await usersApi.getUsers();
			// Filter to only show managers and sales reps (team members)
			teamMembers = users.filter(u => 
				u.role === 'manager' || u.role === 'sales_representative'
			);
		} catch (error) {
			console.error('Failed to load team members:', error);
		} finally {
			loadingMembers = false;
		}
	}

	function handleMemberCreated() {
		loadTeamMembers();
	}

	onMount(async () => {
		loadTeamMembers();
		
		// Ensure supplier is loaded if user has supplier_id but supplier is not in store
		if ($user?.supplierId && !$supplier) {
			try {
				console.log('SettingsManager: User has supplierId but no supplier in store, refreshing...');
				await authStore.refresh();
			} catch (error) {
				console.error('Failed to load supplier:', error);
			}
		} else if (!$user?.supplierId && !$supplier) {
			// User doesn't have supplier_id, try refreshing to get latest data
			try {
				console.log('SettingsManager: No supplier_id in user, refreshing to check...');
				await authStore.refresh();
			} catch (error) {
				console.error('Failed to refresh auth state:', error);
			}
		}
	});
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-gray-900 mb-1">Settings</h2>
		<p class="text-gray-600">Manage your supplier account settings</p>
	</div>

	{#if isOwner}
		{#if hasSupplier}
			<!-- Existing Supplier - Update Mode -->
			<Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-md">
				<CardHeader className="pb-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-green-100">
								<CheckCircle2 class="w-6 h-6 text-green-600" />
							</div>
							<div>
								<CardTitle className="flex items-center gap-2 text-green-900">
									<Building2 class="w-5 h-5 text-green-600" />
									Supplier Information
								</CardTitle>
								<CardDescription className="mt-1 text-green-700">
									Your supplier profile is active and ready to use
								</CardDescription>
							</div>
						</div>
						<div class="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
							Active
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-2">
					<form on:submit|preventDefault={handleSave} class="space-y-4">
						<div class="space-y-2">
							<Label htmlFor="companyName" className="text-gray-700">
								Company Name <span class="text-red-500">*</span>
							</Label>
							<Input 
								id="companyName" 
								bind:value={companyName}
								placeholder="Fresh Foods Inc."
								className="h-10"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="legalName" className="text-gray-700">Legal Name (Optional)</Label>
							<Input 
								id="legalName" 
								bind:value={legalName}
								placeholder="Fresh Foods Incorporated LLC"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="email" className="text-gray-700">
								Email Address <span class="text-red-500">*</span>
							</Label>
							<input
								id="email"
								type="email"
								value={email}
								placeholder="supplier@example.com"
								class="h-10 w-full px-3 rounded-md border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
								disabled
								readonly
							/>
							<p class="text-xs text-gray-500 mt-1">
								Email is automatically set to your owner account email
							</p>
						</div>

						<div class="space-y-2">
							<Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
							<Input 
								id="phone" 
								bind:value={phone}
								placeholder="+1 (555) 123-4567"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="address" className="text-gray-700">Address</Label>
							<Input 
								id="address" 
								bind:value={address}
								placeholder="123 Main Street"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="city" className="text-gray-700">City</Label>
							<Input 
								id="city" 
								bind:value={city}
								placeholder="Almaty"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="country" className="text-gray-700">Country</Label>
							<Input 
								id="country" 
								bind:value={country}
								placeholder="KZ"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="description" className="text-gray-700">Description</Label>
							<textarea
								id="description"
								bind:value={description}
								placeholder="Brief description of your business..."
								class="w-full min-h-[100px] px-3 py-2 rounded-md border border-green-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
							></textarea>
						</div>

						<div class="space-y-2">
							<Label htmlFor="website" className="text-gray-700">Website</Label>
							<Input 
								id="website" 
								type="url"
								bind:value={website}
								placeholder="https://www.example.com"
								className="h-10"
							/>
						</div>

						{#if error}
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						{/if}

						{#if success}
							<Alert className="bg-green-50 border-green-200">
								<AlertDescription className="text-green-800">{success}</AlertDescription>
							</Alert>
						{/if}

						<Button 
							type="submit" 
							className="bg-green-600 hover:bg-green-700 w-full shadow-md"
							disabled={loading}
						>
							{#if loading}
								<Edit class="w-4 h-4 mr-2" />
								Updating...
							{:else}
								<Edit class="w-4 h-4 mr-2" />
								Update Supplier Information
							{/if}
						</Button>
					</form>
				</CardContent>
			</Card>
		{:else}
			<!-- No Supplier - Create Mode -->
			<Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white">
				<CardHeader className="pb-4">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-gray-100">
							<PlusCircle class="w-6 h-6 text-gray-600" />
						</div>
						<div>
							<CardTitle className="flex items-center gap-2 text-gray-900">
								<Building2 class="w-5 h-5 text-gray-600" />
								Create Supplier
							</CardTitle>
							<CardDescription className="mt-1 text-gray-600">
								Set up your supplier company profile to get started
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-2">
					<form on:submit|preventDefault={handleSave} class="space-y-4">
						<div class="space-y-2">
							<Label htmlFor="companyName" className="text-gray-700">
								Company Name <span class="text-red-500">*</span>
							</Label>
							<Input 
								id="companyName" 
								bind:value={companyName}
								placeholder="Fresh Foods Inc."
								className="h-10"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="legalName" className="text-gray-700">Legal Name (Optional)</Label>
							<Input 
								id="legalName" 
								bind:value={legalName}
								placeholder="Fresh Foods Incorporated LLC"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="email" className="text-gray-700">
								Email Address <span class="text-red-500">*</span>
							</Label>
							<input
								id="email"
								type="email"
								value={email}
								placeholder="supplier@example.com"
								class="h-10 w-full px-3 rounded-md border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
								disabled
								readonly
							/>
							<p class="text-xs text-gray-500 mt-1">
								Email is automatically set to your owner account email
							</p>
						</div>

						<div class="space-y-2">
							<Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
							<Input 
								id="phone" 
								bind:value={phone}
								placeholder="+1 (555) 123-4567"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="address" className="text-gray-700">Address</Label>
							<Input 
								id="address" 
								bind:value={address}
								placeholder="123 Main Street"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="city" className="text-gray-700">City</Label>
							<Input 
								id="city" 
								bind:value={city}
								placeholder="Almaty"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="country" className="text-gray-700">Country</Label>
							<Input 
								id="country" 
								bind:value={country}
								placeholder="KZ"
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="description" className="text-gray-700">Description</Label>
							<textarea
								id="description"
								bind:value={description}
								placeholder="Brief description of your business..."
								class="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
							></textarea>
						</div>

						<div class="space-y-2">
							<Label htmlFor="website" className="text-gray-700">Website</Label>
							<Input 
								id="website" 
								type="url"
								bind:value={website}
								placeholder="https://www.example.com"
								className="h-10"
							/>
						</div>

						{#if error}
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						{/if}

						{#if success}
							<Alert className="bg-green-50 border-green-200">
								<AlertDescription className="text-green-800">{success}</AlertDescription>
							</Alert>
						{/if}

						<Button 
							type="submit" 
							className="bg-blue-600 hover:bg-blue-700 w-full shadow-lg"
							disabled={loading}
						>
							{#if loading}
								<PlusCircle class="w-4 h-4 mr-2" />
								Creating...
							{:else}
								<PlusCircle class="w-4 h-4 mr-2" />
								Create Supplier Profile
							{/if}
						</Button>
					</form>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
