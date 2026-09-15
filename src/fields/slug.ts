import type { Field, FieldHook } from 'payload'

/**
 * URL-safe slug from arbitrary title text.
 *
 * Diacritics are decomposed and stripped rather than transliterated, so
 * "Réglages" becomes "reglages" and "Größe" becomes "grosse" — the German
 * sharp s is special-cased because NFD leaves it intact and a bare strip would
 * swallow it entirely.
 */
export function formatSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/ß/g, 'ss')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Localised fields arrive as a plain value when the request names one locale
 * and as a `{ nl: …, en: … }` map when it asks for `all`. Both shapes reach
 * field hooks, so read the one that matches.
 */
function readSibling(value: unknown, locale: string | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && locale) {
    const entry = (value as Record<string, unknown>)[locale]
    if (typeof entry === 'string') return entry
  }
  return undefined
}

const slugHook =
  (source: string): FieldHook =>
  ({ data, operation, originalDoc, req, value }) => {
    // An explicit slug always wins — it is just normalised. Editors change
    // slugs deliberately, and silently regenerating one breaks live URLs.
    if (typeof value === 'string' && value.trim().length > 0) return formatSlug(value)

    const existing = readSibling(originalDoc?.[source], req?.locale)
    const incoming = readSibling(data?.[source], req?.locale)
    const fallback = incoming ?? existing

    if ((operation === 'create' || operation === 'update') && fallback) {
      return formatSlug(fallback)
    }

    return value
  }

/**
 * Per-locale slug.
 *
 * Translating the slug — `/de/blog/iptv-auf-fire-tv-einrichten` rather than the
 * Dutch spelling under a German path — is worth real ranking, so the field is
 * localised. The frontend reads the whole slug map for each post and emits
 * hreflang from it, which is what keeps nine differently-spelled URLs
 * understood as translations of one another rather than nine rival pages.
 */
export function slugField(source = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    index: true,
    localized: true,
    required: true,
    hooks: { beforeValidate: [slugHook(source)] },
    admin: {
      position: 'sidebar',
      description: 'Leave blank to generate it from the title for this locale.',
    },
  }
}
