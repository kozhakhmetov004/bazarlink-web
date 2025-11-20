<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import { usersApi } from '$lib/api/users';
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';

	export let open: boolean = false;
	export let isManager: boolean = false; // If true, role is fixed to sales_representative

	const dispatch = createEventDispatcher();

	let email = '';
	let password = '';
	let retypePassword = '';
	let role: 'manager' | 'sales_representative' = 'manager';
	let fullName = '';
	let loading = false;
	let error = '';

	function handleClose() {
		// Reset form
		email = '';
		password = '';
		retypePassword = '';
		role = isManager ? 'sales_representative' : 'manager';
		fullName = '';
		error = '';
		dispatch('close');
	}

	// Set role to sales_representative when isManager is true
	$: if (isManager) {
		role = 'sales_representative';
	}

	async function handleSubmit() {
		error = '';

		// Validation
		if (!email || !password || !retypePassword || !fullName) {
			error = $_('common.required');
			return;
		}

		if (password !== retypePassword) {
			error = $_('team.passwordsDoNotMatch');
			return;
		}

		if (password.length < 6) {
			error = $_('team.passwordMinLength');
			return;
		}

		loading = true;

		try {
			await usersApi.createUser({
				email,
				password,
				full_name: fullName,
				role
			});

			// Success - close modal and notify parent
			dispatch('created');
			handleClose();
		} catch (err: any) {
			error = err?.message || $_('team.failedToDelete');
		} finally {
			loading = false;
		}
	}
</script>

<Dialog {open} title={isManager ? $_('team.addSalesRepresentative') : $_('team.addMember')} on:close={handleClose}>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="space-y-2">
			<Label htmlFor="fullName" className="text-gray-700">{$_('auth.fullName')}</Label>
			<Input
				id="fullName"
				type="text"
				bind:value={fullName}
				placeholder="John Doe"
				className="h-10"
				required
			/>
		</div>

		<div class="space-y-2">
			<Label htmlFor="email" className="text-gray-700">{$_('auth.email')}</Label>
			<Input
				id="email"
				type="email"
				bind:value={email}
				placeholder="team.member@example.com"
				className="h-10"
				required
			/>
		</div>

		{#if !isManager}
			<div class="space-y-2">
				<Label htmlFor="role" className="text-gray-700">{$_('team.role')}</Label>
				<select
					id="role"
					bind:value={role}
					class="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
					required
				>
					<option value="manager">{$_('common.roles.manager')}</option>
					<option value="sales_representative">{$_('common.roles.sales_representative')}</option>
				</select>
			</div>
		{/if}

		<div class="space-y-2">
			<Label htmlFor="password" className="text-gray-700">{$_('auth.password')}</Label>
			<Input
				id="password"
				type="password"
				bind:value={password}
				placeholder="••••••••"
				className="h-10"
				required
			/>
		</div>

		<div class="space-y-2">
			<Label htmlFor="retypePassword" className="text-gray-700">{$_('team.retypePassword')}</Label>
			<Input
				id="retypePassword"
				type="password"
				bind:value={retypePassword}
				placeholder="••••••••"
				className="h-10"
				required
			/>
		</div>

		{#if error}
			<Alert variant="destructive">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}

		<div class="flex gap-3 pt-2">
			<Button
				type="button"
				variant="outline"
				on:click={handleClose}
				className="flex-1"
				disabled={loading}
			>
				{$_('common.cancel')}
			</Button>
			<Button
				type="submit"
				className="flex-1 bg-green-600 hover:bg-green-700"
				disabled={loading}
			>
				{loading ? $_('common.loading') : (isManager ? $_('team.addSalesRepresentative') : $_('team.addMember'))}
			</Button>
		</div>
	</form>
</Dialog>

