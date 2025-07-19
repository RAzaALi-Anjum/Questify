export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ur'],
};

export type Locale = (typeof i18n)['locales'][number]
