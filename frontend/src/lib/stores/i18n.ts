import { writable } from 'svelte/store';
import { locale, isLoading } from 'svelte-i18n';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

const defaultLocale = 'en';

// Function to get initial locale from localStorage or default
function getInitialLocale(): string {
	if (browser) {
		const savedLocale = localStorage.getItem('locale');
		if (savedLocale && ['en', 'ru', 'kz'].includes(savedLocale)) {
			return savedLocale;
		}
	}
	return defaultLocale;
}

export const currentLocale = writable<string>(getInitialLocale());

// Initialize locale from localStorage or use default
if (browser) {
	const initialLocale = getInitialLocale();
	currentLocale.set(initialLocale);
	locale.set(initialLocale);
}

// Subscribe to locale changes and save to localStorage
currentLocale.subscribe((value) => {
	if (browser) {
		// Save to localStorage
		localStorage.setItem('locale', value);
		// Update svelte-i18n locale store
		locale.set(value);
	}
});

// Also subscribe to svelte-i18n locale changes to keep in sync
// (in case something else changes the locale directly)
if (browser) {
	locale.subscribe((value) => {
		const current = get(currentLocale);
		if (current !== value) {
			currentLocale.set(value);
			localStorage.setItem('locale', value);
		}
	});
}

export { locale, isLoading };

