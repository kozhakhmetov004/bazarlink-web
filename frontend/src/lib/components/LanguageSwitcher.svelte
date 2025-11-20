<script lang="ts">
	import { currentLocale } from '$lib/stores/i18n';
	import { _ } from 'svelte-i18n';
	import { Globe } from 'lucide-svelte';

	const languages = [
		{ code: 'en', name: 'English', native: 'English' },
		{ code: 'ru', name: 'Russian', native: 'Русский' },
		{ code: 'kz', name: 'Kazakh', native: 'Қазақ' }
	];

	let showDropdown = false;

	function setLocale(locale: string) {
		currentLocale.set(locale);
		showDropdown = false;
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
</script>

<div class="relative group">
	<button
		type="button"
		on:click={toggleDropdown}
		class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
		title={$_('language.switch')}
	>
		<Globe class="w-4 h-4 text-gray-600" />
		<span class="text-sm text-gray-700">
			{#each languages as lang}
				{#if $currentLocale === lang.code}
					{lang.native}
				{/if}
			{/each}
		</span>
	</button>
	
	{#if showDropdown}
		<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
			{#each languages as lang}
				<button
					type="button"
					on:click={() => setLocale(lang.code)}
					class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between {$currentLocale === lang.code ? 'bg-green-50 text-green-700' : 'text-gray-700'}"
				>
					<span>{lang.native}</span>
					{#if $currentLocale === lang.code}
						<span class="text-green-600">✓</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<svelte:window on:click={(e) => {
	if (showDropdown && !e.target.closest('.relative.group')) {
		showDropdown = false;
	}
}} />

