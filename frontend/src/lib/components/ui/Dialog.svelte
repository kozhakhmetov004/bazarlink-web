<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let open: boolean = false;
	export let title: string = '';
	
	const dispatch = createEventDispatcher();

	// Prevent body scroll when modal is open and ensure full coverage
	$: if (browser && open) {
		document.body.style.overflow = 'hidden';
		// Ensure html and body have no margin/padding that could cause white space
		document.documentElement.style.overflow = 'hidden';
	} else if (browser) {
		document.body.style.overflow = '';
		document.documentElement.style.overflow = '';
	}

	function handleClose() {
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		// Only close if clicking directly on the backdrop, not on the dialog content
		const target = event.target as HTMLElement;
		if (target && target.classList.contains('backdrop')) {
			handleClose();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (event.target === event.currentTarget) {
				handleClose();
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
		style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; margin: 0; padding: 0;"
		on:click={handleBackdropClick}
		on:keydown={handleBackdropKeydown}
		tabindex="0"
		role="button"
		aria-label="Close dialog"
	>
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<div class="p-6">
				{#if title}
					<h2 id="dialog-title" class="text-xl font-semibold text-gray-900 mb-4">
						{title}
					</h2>
				{/if}
				<slot />
			</div>
		</div>
	</div>
{/if}

