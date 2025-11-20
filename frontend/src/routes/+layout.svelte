<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore, user } from '$lib/stores/auth';
	import Layout from '$lib/components/Layout.svelte';
	import LoginLayout from '$lib/components/LoginLayout.svelte';
	import '$lib/i18n';
	import { currentLocale } from '$lib/stores/i18n';

	let mounted = false;
	
	onMount(() => {
		mounted = true;
		// Initialize locale from store
		currentLocale.subscribe((loc) => {
			// Locale is already set in the store
		});
	});

	$: isAuthenticated = $user !== null;
	$: currentPath = $page.url.pathname;

	// Redirect to login if not authenticated and not on login page
	$: if (mounted && !isAuthenticated && currentPath !== '/login') {
		goto('/login');
	}
</script>

{#if isAuthenticated}
	<Layout>
		<slot />
	</Layout>
{:else}
	<LoginLayout>
		<slot />
	</LoginLayout>
{/if}
