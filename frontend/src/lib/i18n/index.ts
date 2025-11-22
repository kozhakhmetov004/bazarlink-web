import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('ru', () => import('./locales/ru.json'));
register('kz', () => import('./locales/kz.json'));

// Get initial locale from localStorage first, then browser, then default
function getInitialLocale(): string {
	if (browser) {
		// Check localStorage first (user's saved preference)
		const savedLocale = localStorage.getItem('locale');
		if (savedLocale && ['en', 'ru', 'kz'].includes(savedLocale)) {
			return savedLocale;
		}
		
		// Fall back to browser language if no saved preference
		const browserLocale = getLocaleFromNavigator();
		if (browserLocale && ['en', 'ru', 'kz'].includes(browserLocale)) {
			// Save browser locale to localStorage
			localStorage.setItem('locale', browserLocale);
			return browserLocale;
		}
		
		// If browser language is not supported, extract language code
		if (browserLocale) {
			const langCode = browserLocale.split('-')[0].toLowerCase();
			if (langCode === 'ru' || langCode === 'kz') {
				localStorage.setItem('locale', langCode);
				return langCode;
			}
		}
	}
	
	return defaultLocale;
}

init({
	fallbackLocale: defaultLocale,
	initialLocale: getInitialLocale(),
});

