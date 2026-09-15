/**
 * The locales the public site ships, mirrored from the frontend's
 * `src/i18n/config.ts`. These two lists must stay identical: a locale that
 * exists here but not there produces content nothing can render, and one that
 * exists there but not here produces a page with no source of copy.
 *
 * `code` is the URL segment, `label` is the endonym shown in the admin locale
 * switcher.
 */
export const localeCodes = ['nl', 'en', 'de', 'fr', 'es', 'da', 'no', 'sv', 'pl'] as const

export type LocaleCode = (typeof localeCodes)[number]

export const defaultLocale: LocaleCode = 'nl'

export const localeLabels: Record<LocaleCode, string> = {
  nl: 'Nederlands',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  da: 'Dansk',
  no: 'Norsk',
  sv: 'Svenska',
  pl: 'Polski',
}

export const localeOptions = localeCodes.map((code) => ({
  code,
  label: localeLabels[code],
}))
