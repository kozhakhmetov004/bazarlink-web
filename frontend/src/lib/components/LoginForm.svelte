<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AlertDescription from '$lib/components/ui/AlertDescription.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { _ } from 'svelte-i18n';
	import { Store, ArrowRight, Sparkles } from 'lucide-svelte';

	let isRegister = false;
	let email = '';
	let password = '';
	let name = '';
	let supplierName = '';
	let phone = '';
	let error = '';
	let loading = false;

	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			let success = false;
			
			if (isRegister) {
				success = await authStore.register(email, password, name, supplierName, phone);
			} else {
				success = await authStore.login(email, password);
			}

			if (!success) {
				error = isRegister ? $_('auth.registrationFailed') : $_('auth.invalidCredentials');
			} else {
				// Success - navigation will happen automatically via reactive statement in parent
			}
		} catch (err: any) {
			// Get user-friendly error message
			const errorMessage = err?.message || $_('auth.errorOccurred');
			error = errorMessage;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
	<!-- Background decoration -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-green-400/20 rounded-full blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl"></div>
	</div>
	
	<Card className="w-full max-w-md relative shadow-2xl border-0 animate-scale-in">
		<CardHeader className="text-center pb-6">
			<div class="flex justify-center mb-6">
				<div class="relative">
					<div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-xl shadow-green-500/40 animate-pulse">
						<Store class="w-10 h-10 text-white" />
					</div>
					<div class="absolute -top-1 -right-1">
						<Sparkles class="w-6 h-6 text-yellow-400 fill-yellow-400" />
					</div>
				</div>
			</div>
			<div class="absolute top-4 right-4">
				<LanguageSwitcher />
			</div>
			<CardTitle className="text-gray-900">
				{isRegister ? $_('auth.createAccount') : $_('auth.welcomeBack')}
			</CardTitle>
			<CardDescription className="text-base mt-2">
				{isRegister
					? $_('auth.registerDescription')
					: $_('auth.signInDescription')}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form on:submit|preventDefault={handleSubmit} class="space-y-5">
				{#if isRegister}
					<div class="space-y-2">
						<Label htmlFor="name" className="text-gray-700">{$_('auth.fullName')}</Label>
						<Input
							id="name"
							type="text"
							bind:value={name}
							placeholder="John Doe"
							className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label htmlFor="supplierName" className="text-gray-700">{$_('auth.supplierName')}</Label>
						<Input
							id="supplierName"
							type="text"
							bind:value={supplierName}
							placeholder="Fresh Foods Inc."
							className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label htmlFor="phone" className="text-gray-700">{$_('auth.phone')}</Label>
						<Input
							id="phone"
							type="tel"
							bind:value={phone}
							placeholder="+1 (555) 123-4567"
							className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>
				{/if}
				
				<div class="space-y-2">
					<Label htmlFor="email" className="text-gray-700">{$_('auth.email')}</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="owner@supplier.com"
						className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label htmlFor="password" className="text-gray-700">{$_('auth.password')}</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						className="h-11 border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
						required
					/>
				</div>

				{#if error}
					<Alert variant="destructive" className="animate-slide-in">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<Button
					type="submit"
					className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300"
					disabled={loading}
				>
					{#if loading}
						<span class="flex items-center gap-2">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{$_('auth.pleaseWait')}
						</span>
					{:else}
						<span class="flex items-center gap-2">
							{isRegister ? $_('auth.createAccountButton') : $_('auth.signIn')}
							<ArrowRight class="w-4 h-4" />
						</span>
					{/if}
				</Button>

				<div class="text-center pt-2">
					<button
						type="button"
						on:click={() => {
							isRegister = !isRegister;
							error = '';
							// Clear form fields when switching
							if (!isRegister) {
								name = '';
								supplierName = '';
								phone = '';
							}
						}}
						class="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
					>
						{isRegister
							? $_('auth.alreadyHaveAccount')
							: $_('auth.noAccount')}
					</button>
				</div>

				
			</form>
		</CardContent>
	</Card>
</div>

