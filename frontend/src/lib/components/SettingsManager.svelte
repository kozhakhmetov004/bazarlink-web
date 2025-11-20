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
	import { Settings, Users, Plus, Building2, CheckCircle2, PlusCircle, Edit, User } from 'lucide-svelte';
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
	let userEmail = '';
	let acknowledgeTransfer = false;
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
	
	let loading = false;
	let error = '';
	let success = '';

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
	
	// Reset email to current user email when checkbox is unchecked
	$: if (!acknowledgeTransfer && $user) {
		userEmail = $user.email || '';
	}
	
	// Load user data from API into form fields
	async function loadUserData() {
		if (!$user || !isOwner) return;
		
		try {
			const userResponse = await usersApi.getUser($user.id);
			userFullName = userResponse.full_name || '';
			userPhone = userResponse.phone || '';
			userEmail = userResponse.email || '';
		} catch (err) {
			console.error('Failed to load user data:', err);
			// Fallback to store data
			userFullName = $user.name || '';
			userPhone = '';
			userEmail = $user.email || '';
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

	async function handleUpdateUser() {
		if (!$user || !isOwner) return;
		
		if (!userFullName.trim()) {
			userError = $_('settings.fullName') + ' ' + $_('common.required').toLowerCase();
			return;
		}
		
		// Validate email if acknowledgment is checked
		if (acknowledgeTransfer && !userEmail.trim()) {
			userError = $_('settings.ownerEmail') + ' ' + $_('common.required').toLowerCase();
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
			
			// Include email if acknowledgment checkbox is checked
			if (acknowledgeTransfer && userEmail.trim()) {
				updateData.email = userEmail.trim();
			}
			
			await usersApi.updateUser(userId, updateData);

			// Refresh auth store to get updated user data
			await authStore.refresh();
			
			// Reload user data to get latest from API
			await loadUserData();
			
			// Reset acknowledgment checkbox after successful update
			acknowledgeTransfer = false;

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
						<Label htmlFor="userEmail" className="text-gray-700">
							{acknowledgeTransfer ? $_('settings.ownerEmail') : $_('settings.emailReadOnly')}
							{#if acknowledgeTransfer}
								<span class="text-red-500">*</span>
							{/if}
						</Label>
						{#if acknowledgeTransfer}
							<Input 
								id="userEmail" 
								type="email"
								bind:value={userEmail}
								placeholder={$_('settings.placeholders.ownerEmail')}
								className="h-10"
								required
							/>
						{:else}
							<Input 
								id="userEmail" 
								type="email"
								value={$user?.email || ''}
								className="h-10 bg-gray-100"
								disabled
								readonly
							/>
						{/if}
					</div>

					<!-- Owner Transfer Acknowledgment -->
					<div class="space-y-3 pt-2 border-t border-gray-200">
						<div class="flex items-start gap-3">
							<input
								type="checkbox"
								id="acknowledgeTransfer"
								bind:checked={acknowledgeTransfer}
								class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<Label htmlFor="acknowledgeTransfer" className="text-gray-700 cursor-pointer">
								{$_('settings.transferSupplierAcknowledgment')}
							</Label>
						</div>
						{#if acknowledgeTransfer}
							<p class="text-xs text-gray-500 pl-7">
								{$_('settings.ownerEmailHint')}
							</p>
						{/if}
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
	{/if}
</div>
