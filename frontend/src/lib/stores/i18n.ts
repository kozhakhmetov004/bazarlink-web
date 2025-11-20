import { writable } from 'svelte/store';
import { locale, isLoading } from 'svelte-i18n';
import { browser } from '$app/environment';

const defaultLocale = 'en';

export const currentLocale = writable<string>(defaultLocale);

// Initialize locale from localStorage or use default
if (browser) {
	const savedLocale = localStorage.getItem('locale') || defaultLocale;
	currentLocale.set(savedLocale);
	locale.set(savedLocale);
}

// Subscribe to locale changes and save to localStorage
currentLocale.subscribe((value) => {
	if (browser) {
		localStorage.setItem('locale', value);
		locale.set(value);
	}
});

export { locale, isLoading };

