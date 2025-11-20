import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('ru', () => import('./locales/ru.json'));
register('kz', () => import('./locales/kz.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: getLocaleFromNavigator() || defaultLocale,
});

