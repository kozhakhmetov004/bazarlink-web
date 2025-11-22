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
	import { _ } from 'svelte-i18n';
	import { Settings, Users, Plus, Building2, CheckCircle2, PlusCircle, Edit, User, ArrowRightLeft, AlertTriangle } from 'lucide-svelte';
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

	// User form fields (for owner's own account)
	let userFullName = '';
	let userPhone = '';
	let userLoading = false;
	let userError = '';
	let userSuccess = '';

	// Supplier form fields
	let companyName = '';
	let legalName = '';
	let email = '';
	let phone = '';
	let address = '';
	let city = '';
	let country = 'KZ';
	let description = '';
	let website = '';
	let deliveryAvailable = true;
	let pickupAvailable = true;
	let leadTimeDays = 1;
	
	let loading = false;
	let error = '';
	let success = '';

	// Transfer ownership form fields
	let transferEmail = '';
	let transferFullName = '';
	let transferPassword = '';
	let transferPhone = '';
	let transferLoading = false;
	let transferError = '';
	let transferSuccess = '';
	let existingManagers: UserResponse[] = [];
	let selectedManagerId: number = 0;
	let createNewManager = true;

	// Function to load supplier data from API into form fields
	async function loadSupplierFormData() {
		if (!$supplier || !$user) {
			// Reset form if no supplier
			companyName = '';
			legalName = '';
			email = '';
			phone = '';
			address = '';
			city = '';
			country = 'KZ';
			description = '';
			website = '';
			deliveryAvailable = true;
			pickupAvailable = true;
			leadTimeDays = 1;
			return;
		}
		
		try {
			const supplierId = parseInt($supplier.id);
			const supplierResponse = await suppliersApi.getSupplier(supplierId);
			
			// Populate all form fields from API response
			companyName = supplierResponse.company_name || '';
			legalName = supplierResponse.legal_name || '';
			email = supplierResponse.email || '';
			phone = supplierResponse.phone || '';
			address = supplierResponse.address || '';
			city = supplierResponse.city || '';
			country = supplierResponse.country || 'KZ';
			description = supplierResponse.description || '';
			website = supplierResponse.website || '';
			deliveryAvailable = supplierResponse.delivery_available ?? true;
			pickupAvailable = supplierResponse.pickup_available ?? true;
			leadTimeDays = supplierResponse.lead_time_days ?? 1;
			
			console.log('Form fields loaded from API:', {
				companyName,
				legalName,
				email,
				phone,
				address,
				city,
				country,
				description,
				website
			});
		} catch (err) {
			console.error('Failed to load supplier form data:', err);
			// Fallback to store data if API fails
			companyName = $supplier.name || '';
			phone = $supplier.contactPhone || '';
			address = $supplier.address || '';
			description = $supplier.description || '';
		}
	}

	// Load supplier data on mount and when supplier changes
	let lastSupplierId: string | null = null;
	$: if ($supplier && $user && $supplier.id !== lastSupplierId) {
		lastSupplierId = $supplier.id;
		// Load full data from API when supplier changes
		loadSupplierFormData();
	}
	
	// Initialize email with owner's email when creating new supplier (if email is empty)
	$: if (!$supplier && $user && !email) {
		email = $user.email || '';
	}

	$: hasSupplier = !!$supplier;
	$: isOwner = $user?.role === 'owner';
	
	// Load user data from API into form fields
	async function loadUserData() {
		if (!$user || !isOwner) return;
		
		try {
			const userResponse = await usersApi.getUser($user.id);
			userFullName = userResponse.full_name || '';
			userPhone = userResponse.phone || '';
		} catch (err) {
			console.error('Failed to load user data:', err);
			// Fallback to store data
			userFullName = $user.name || '';
			userPhone = '';
		}
	}
	
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
				
				console.log('Updating supplier:', supplierId, {
					company_name: companyName,
					legal_name: legalName,
					email,
					phone,
					address,
					city,
					description,
					website,
					country
				});
				
				// Update supplier via API
				const updatedSupplierResponse = await suppliersApi.updateSupplier(supplierId, {
					company_name: companyName,
					legal_name: legalName || undefined,
					email: email || undefined,
					phone: phone || undefined,
					address: address || undefined,
					city: city || undefined,
					country: country || undefined,
					description: description || undefined,
					website: website || undefined,
					delivery_available: deliveryAvailable,
					pickup_available: pickupAvailable,
					lead_time_days: leadTimeDays,
				});

				console.log('Supplier updated, response:', updatedSupplierResponse);

				// Refresh supplier data from API to get latest
				const refreshedSupplier = await suppliersApi.getSupplier(supplierId);
				console.log('Refreshed supplier from API:', refreshedSupplier);
				
				// Map to frontend format
				const mappedSupplier = mapSupplier(refreshedSupplier);
				mappedSupplier.ownerId = $user!.id;
				
				// Update localStorage FIRST
				if (browser) {
					localStorage.setItem('currentSupplier', JSON.stringify(mappedSupplier));
				}
				
				// Update form fields with refreshed data
				companyName = refreshedSupplier.company_name || '';
				legalName = refreshedSupplier.legal_name || '';
				email = refreshedSupplier.email || '';
				phone = refreshedSupplier.phone || '';
				address = refreshedSupplier.address || '';
				city = refreshedSupplier.city || '';
				country = refreshedSupplier.country || 'KZ';
				description = refreshedSupplier.description || '';
				website = refreshedSupplier.website || '';
				deliveryAvailable = refreshedSupplier.delivery_available ?? true;
				pickupAvailable = refreshedSupplier.pickup_available ?? true;
				leadTimeDays = refreshedSupplier.lead_time_days ?? 1;
				
				// Update the supplier in the store
				// Use refresh to sync, but don't reload form data (we already have it)
				// Reset lastSupplierId to prevent reactive statement from reloading
				lastSupplierId = $supplier!.id; // Set to current to prevent reload
				
				// Refresh auth store to sync the updated supplier
				// This will reload from API and update the store
				// We do this in the background so it doesn't block the UI
				authStore.refresh().catch((refreshError) => {
					console.warn('Failed to refresh auth store, but update was successful:', refreshError);
					// Don't fail the whole operation if refresh fails
				});

				success = $_('settings.updateSuccess');
			} else {
				// Create new supplier (backend will automatically link it to owner)
				const newSupplier = await suppliersApi.createSupplier({
					company_name: companyName,
					legal_name: legalName || undefined,
					email: email || $user!.email, // Use provided email or fallback to owner's email
					phone: phone || undefined,
					address: address || undefined,
					city: city || undefined,
					country: country || 'KZ',
					description: description || undefined,
					website: website || undefined,
					delivery_available: deliveryAvailable,
					pickup_available: pickupAvailable,
					lead_time_days: leadTimeDays,
				});

				// Refresh auth store to get updated user with supplier_id
				await authStore.refresh();

				success = $_('settings.createSuccess');
			}
		} catch (err: any) {
			error = err?.message || $_('settings.saveError');
			console.error('Supplier save error:', err);
		} finally {
			loading = false;
		}
	}

	async function loadTeamMembers() {
		if ($user?.role !== 'owner' || !$user?.supplierId) return;
		
		loadingMembers = true;
		try {
			const users = await usersApi.getUsers();
			const ownerSupplierId = parseInt($user.supplierId);
			
			// Filter to only show managers and sales reps from the same supplier
			teamMembers = users.filter(u => 
				(u.role === 'manager' || u.role === 'sales_representative') &&
				u.supplier_id === ownerSupplierId
			);
			
			// Load existing managers for transfer ownership - only from this supplier
			existingManagers = users.filter(u => 
				u.role === 'manager' && 
				u.supplier_id === ownerSupplierId
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

	async function handleTransferOwnership() {
		if (!$user || !isOwner) return;
		
		transferError = '';
		transferSuccess = '';
		
		// Validate form
		if (createNewManager) {
			if (!transferEmail.trim()) {
				transferError = 'Email is required';
				return;
			}
			if (!transferFullName.trim()) {
				transferError = 'Full name is required';
				return;
			}
			if (!transferPassword.trim() || transferPassword.length < 6) {
				transferError = 'Password is required and must be at least 6 characters';
				return;
			}
		} else {
			if (!selectedManagerId || selectedManagerId === 0) {
				transferError = 'Please select a manager';
				return;
			}
		}

		transferLoading = true;

		try {
			let managerId: number;

			if (createNewManager) {
				// First, create a new manager with the given email
				const newManager = await usersApi.createUser({
					email: transferEmail.trim(),
					full_name: transferFullName.trim(),
					password: transferPassword,
					phone: transferPhone.trim() || undefined,
					role: 'manager',
					language: ($user?.language as string) || 'en'
				});
				
				managerId = newManager.id;
				transferSuccess = 'Manager created successfully. ';
			} else {
				// Use existing manager
				managerId = selectedManagerId;
			}

			// Transfer ownership to the manager
			// The backend will automatically:
			// 1. Make the manager the new owner
			// 2. Set current owner's supplier_id to None
			// 3. Delete the current owner's account
			await usersApi.transferOwnership({
				new_owner_user_id: managerId
			});

			transferSuccess = 'Ownership transferred successfully. Your account has been deleted by the backend. ';

			// Clear auth state and logout since the account was deleted by backend
			// The token is now invalid, so we need to logout
			authStore.logout();
			
			transferSuccess += 'You have been logged out. The new owner can now log in with their account.';

		} catch (err: any) {
			transferError = err?.message || 'Failed to transfer ownership';
			console.error('Transfer ownership error:', err);
		} finally {
			transferLoading = false;
		}
	}

	async function handleUpdateUser() {
		if (!$user || !isOwner) return;
		
		if (!userFullName.trim()) {
			userError = $_('settings.fullName') + ' ' + $_('common.required').toLowerCase();
			return;
		}
		
		userError = '';
		userSuccess = '';
		userLoading = true;

		try {
			const userId = parseInt($user.id);
			const updateData: any = {
				full_name: userFullName.trim(),
				phone: userPhone.trim() || undefined,
			};
			
			await usersApi.updateUser(userId, updateData);

			// Refresh auth store to get updated user data
			await authStore.refresh();
			
			// Reload user data to get latest from API
			await loadUserData();

			userSuccess = $_('settings.userUpdateSuccess');
		} catch (err: any) {
			userError = err?.message || $_('settings.userUpdateError');
			console.error('User update error:', err);
		} finally {
			userLoading = false;
		}
	}

	onMount(async () => {
		loadTeamMembers();
		
		// Load user data for owner
		if (isOwner) {
			await loadUserData();
		}
		
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
		<h2 class="text-gray-900 mb-1">{$_('settings.title')}</h2>
		<p class="text-gray-600">{$_('settings.description')}</p>
	</div>

	{#if isOwner}
		<!-- User Information Section (Owner Only) -->
		<Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md">
			<CardHeader className="pb-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-blue-100">
						<User class="w-6 h-6 text-blue-600" />
					</div>
					<div>
						<CardTitle className="flex items-center gap-2 text-blue-900">
							{$_('settings.userInformation')}
						</CardTitle>
						<CardDescription className="mt-1 text-blue-700">
							{$_('settings.userInformationDescription')}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-2">
				<form on:submit|preventDefault={handleUpdateUser} class="space-y-4">
					<div class="space-y-2">
						<Label htmlFor="userFullName" className="text-gray-700">
							{$_('settings.fullName')} <span class="text-red-500">*</span>
						</Label>
						<Input 
							id="userFullName" 
							bind:value={userFullName}
							placeholder={$_('auth.fullName')}
							className="h-10"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label htmlFor="userPhone" className="text-gray-700">{$_('settings.phone')}</Label>
						<Input 
							id="userPhone" 
							bind:value={userPhone}
							placeholder={$_('settings.placeholders.phone')}
							className="h-10"
						/>
					</div>

					{#if userError}
						<Alert variant="destructive">
							<AlertDescription>{userError}</AlertDescription>
						</Alert>
					{/if}

					{#if userSuccess}
						<Alert className="bg-green-50 border-green-200">
							<AlertDescription className="text-green-800">{userSuccess}</AlertDescription>
						</Alert>
					{/if}

					<Button 
						type="submit" 
						className="bg-blue-600 hover:bg-blue-700 w-full shadow-md"
						disabled={userLoading}
					>
						{#if userLoading}
							<Edit class="w-4 h-4 mr-2" />
							{$_('settings.updatingUser')}
						{:else}
							<Edit class="w-4 h-4 mr-2" />
							{$_('settings.updateUser')}
						{/if}
					</Button>
				</form>
			</CardContent>
		</Card>

		<!-- Supplier Information Section -->
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
									{$_('settings.supplierInformation')}
								</CardTitle>
								<CardDescription className="mt-1 text-green-700">
									{$_('settings.activeDescription')}
								</CardDescription>
							</div>
						</div>
						<div class="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
							{$_('common.active')}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-2">
					<form on:submit|preventDefault={handleSave} class="space-y-4">
						<div class="space-y-2">
							<Label htmlFor="companyName" className="text-gray-700">
								{$_('settings.companyName')} <span class="text-red-500">*</span>
							</Label>
							<Input 
								id="companyName" 
								bind:value={companyName}
								placeholder={$_('settings.placeholders.companyName')}
								className="h-10"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="legalName" className="text-gray-700">{$_('settings.legalName')}</Label>
							<Input 
								id="legalName" 
								bind:value={legalName}
								placeholder={$_('settings.placeholders.legalName')}
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="email" className="text-gray-700">
								{$_('settings.email')} <span class="text-red-500">*</span>
							</Label>
							<Input 
								id="email" 
								type="email"
								bind:value={email}
								placeholder={$_('settings.placeholders.email')}
								className="h-10"
								required
							/>
							<p class="text-xs text-gray-500 mt-1">
								{$_('settings.emailHint')}
							</p>
						</div>

						<div class="space-y-2">
							<Label htmlFor="phone" className="text-gray-700">{$_('settings.phone')}</Label>
							<Input 
								id="phone" 
								bind:value={phone}
								placeholder={$_('settings.placeholders.phone')}
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="address" className="text-gray-700">{$_('settings.address')}</Label>
							<Input 
								id="address" 
								bind:value={address}
								placeholder={$_('settings.placeholders.address')}
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="city" className="text-gray-700">{$_('settings.city')}</Label>
							<Input 
								id="city" 
								bind:value={city}
								placeholder={$_('settings.placeholders.city')}
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="country" className="text-gray-700">{$_('settings.country')}</Label>
							<Input 
								id="country" 
								bind:value={country}
								placeholder={$_('settings.placeholders.country')}
								className="h-10"
							/>
						</div>

						<div class="space-y-2">
							<Label htmlFor="description" className="text-gray-700">{$_('settings.description')}</Label>
							<textarea
								id="description"
								bind:value={description}
								placeholder={$_('settings.placeholders.description')}
								class="w-full min-h-[100px] px-3 py-2 rounded-md border border-green-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
							></textarea>
						</div>

						<div class="space-y-2">
							<Label htmlFor="website" className="text-gray-700">{$_('settings.website')}</Label>
							<Input 
								id="website" 
								type="url"
								bind:value={website}
								placeholder={$_('settings.placeholders.website')}
								className="h-10"
							/>
						</div>

						<!-- Delivery Options Section -->
						<div class="space-y-4 pt-4 border-t border-gray-200">
							<h3 class="text-sm font-semibold text-gray-900">{$_('settings.deliveryOptions')}</h3>
							
							<div class="space-y-3">
								<div class="flex items-start gap-3">
									<input
										type="checkbox"
										id="deliveryAvailable"
										bind:checked={deliveryAvailable}
										class="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
									/>
									<Label htmlFor="deliveryAvailable" className="text-gray-700 cursor-pointer">
										{$_('settings.deliveryAvailable')}
									</Label>
								</div>
								
								<div class="flex items-start gap-3">
									<input
										type="checkbox"
										id="pickupAvailable"
										bind:checked={pickupAvailable}
										class="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
									/>
									<Label htmlFor="pickupAvailable" className="text-gray-700 cursor-pointer">
										{$_('settings.pickupAvailable')}
									</Label>
								</div>
							</div>

							<div class="space-y-2">
								<Label htmlFor="leadTimeDays" className="text-gray-700">
									{$_('settings.leadTimeDays')}
								</Label>
								<Input 
									id="leadTimeDays" 
									type="number"
									min="1"
									bind:value={leadTimeDays}
									placeholder="1"
									className="h-10"
								/>
								<p class="text-xs text-gray-500 mt-1">
									{$_('settings.leadTimeDaysHint')}
								</p>
							</div>
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
								{$_('settings.updating')}
							{:else}
								<Edit class="w-4 h-4 mr-2" />
								{$_('settings.updateSupplier')}
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
								{$_('settings.createSupplier')}
							</CardTitle>
							<CardDescription className="mt-1 text-gray-600">
								{$_('settings.createDescription')}
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
							<Input 
								id="email" 
								type="email"
								bind:value={email}
								placeholder="supplier@example.com"
								className="h-10"
								required
							/>
							<p class="text-xs text-gray-500 mt-1">
								Supplier contact email (can be different from owner email)
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
								{$_('settings.creating')}
							{:else}
								<PlusCircle class="w-4 h-4 mr-2" />
								{$_('settings.createSupplierProfile')}
							{/if}
						</Button>
					</form>
				</CardContent>
			</Card>
		{/if}

		<!-- Transfer Ownership Section -->
		<Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-md">
			<CardHeader className="pb-4">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-orange-100">
						<ArrowRightLeft class="w-6 h-6 text-orange-600" />
					</div>
					<div>
						<CardTitle className="flex items-center gap-2 text-orange-900">
							Transfer Ownership
						</CardTitle>
						<CardDescription className="mt-1 text-orange-700">
							Transfer ownership of your supplier to another manager. You can create a new manager or select an existing one.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-2">
				<div class="space-y-4">
					<!-- Warning Alert -->
					<Alert className="bg-orange-50 border-orange-200">
						<AlertTriangle class="w-4 h-4 text-orange-600 mr-2" />
						<AlertDescription className="text-orange-800">
							<strong>Warning:</strong> After transferring ownership, your account will be automatically deleted by the backend. 
							The selected manager will become the new owner of your supplier. This action cannot be undone.
						</AlertDescription>
					</Alert>

					<!-- Toggle between creating new manager or selecting existing -->
					<div class="space-y-3 pt-2 border-t border-gray-200">
						<div class="flex items-center gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="transferMode"
									bind:group={createNewManager}
									value={true}
									class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
								/>
								<span class="text-gray-700">Create New Manager</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="transferMode"
									bind:group={createNewManager}
									value={false}
									class="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
								/>
								<span class="text-gray-700">Select Existing Manager</span>
							</label>
						</div>
					</div>

					{#if createNewManager}
						<!-- Create New Manager Form -->
						<form on:submit|preventDefault={handleTransferOwnership} class="space-y-4">
							<div class="space-y-2">
								<Label htmlFor="transferEmail" className="text-gray-700">
									Email Address <span class="text-red-500">*</span>
								</Label>
								<Input 
									id="transferEmail" 
									type="email"
									bind:value={transferEmail}
									placeholder="newowner@example.com"
									className="h-10"
									required
								/>
							</div>

							<div class="space-y-2">
								<Label htmlFor="transferFullName" className="text-gray-700">
									Full Name <span class="text-red-500">*</span>
								</Label>
								<Input 
									id="transferFullName" 
									bind:value={transferFullName}
									placeholder="John Doe"
									className="h-10"
									required
								/>
							</div>

							<div class="space-y-2">
								<Label htmlFor="transferPassword" className="text-gray-700">
									Password <span class="text-red-500">*</span>
								</Label>
								<Input 
									id="transferPassword" 
									type="password"
									bind:value={transferPassword}
									placeholder="Minimum 6 characters"
									className="h-10"
									required
									minlength="6"
								/>
							</div>

							<div class="space-y-2">
								<Label htmlFor="transferPhone" className="text-gray-700">Phone Number (Optional)</Label>
								<Input 
									id="transferPhone" 
									bind:value={transferPhone}
									placeholder="+1 (555) 123-4567"
									className="h-10"
								/>
							</div>

							{#if transferError}
								<Alert variant="destructive">
									<AlertDescription>{transferError}</AlertDescription>
								</Alert>
							{/if}

							{#if transferSuccess}
								<Alert className="bg-green-50 border-green-200">
									<AlertDescription className="text-green-800">{transferSuccess}</AlertDescription>
								</Alert>
							{/if}

							<Button 
								type="submit" 
								className="bg-orange-600 hover:bg-orange-700 w-full shadow-md"
								disabled={transferLoading}
							>
								{#if transferLoading}
									<ArrowRightLeft class="w-4 h-4 mr-2" />
									Transferring Ownership...
								{:else}
									<ArrowRightLeft class="w-4 h-4 mr-2" />
									Create Manager and Transfer Ownership
								{/if}
							</Button>
						</form>
					{:else}
						<!-- Select Existing Manager Form -->
						<form on:submit|preventDefault={handleTransferOwnership} class="space-y-4">
							{#if existingManagers.length === 0}
								<Alert className="bg-yellow-50 border-yellow-200">
									<AlertDescription className="text-yellow-800">
										No existing managers found. Please create a manager first using the "Create New Manager" option.
									</AlertDescription>
								</Alert>
							{:else}
								<div class="space-y-2">
									<Label htmlFor="selectedManager" className="text-gray-700">
										Select Manager <span class="text-red-500">*</span>
									</Label>
									<select
										id="selectedManager"
										bind:value={selectedManagerId}
										class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
										required
									>
										<option value={0}>Select a manager...</option>
										{#each existingManagers as manager}
											<option value={manager.id}>{manager.full_name} ({manager.email})</option>
										{/each}
									</select>
								</div>
							{/if}

							{#if transferError}
								<Alert variant="destructive">
									<AlertDescription>{transferError}</AlertDescription>
								</Alert>
							{/if}

							{#if transferSuccess}
								<Alert className="bg-green-50 border-green-200">
									<AlertDescription className="text-green-800">{transferSuccess}</AlertDescription>
								</Alert>
							{/if}

							<Button 
								type="submit" 
								className="bg-orange-600 hover:bg-orange-700 w-full shadow-md"
								disabled={transferLoading || existingManagers.length === 0}
							>
								{#if transferLoading}
									<ArrowRightLeft class="w-4 h-4 mr-2" />
									Transferring Ownership...
								{:else}
									<ArrowRightLeft class="w-4 h-4 mr-2" />
									Transfer Ownership
								{/if}
							</Button>
						</form>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
