import type { Field } from 'payload'

/**
 * Per-document search-engine overrides.
 *
 * Every field here is optional on purpose. The frontend falls back to the
 * post's own title and excerpt, which are written for humans and are usually
 * the right thing to serve — these exist for the cases where the SERP wants
 * something shorter, or where a page must be kept out of the index entirely.
 *
 * The character counts in the descriptions are Google's practical truncation
 * points, not hard limits, so they are guidance rather than validation.
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description: 'Optional overrides. Left empty, the title and excerpt above are used.',
  },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Overrides the <title> tag. Aim for under ~60 characters.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Overrides the meta description. Aim for 120–160 characters.',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Social card image. Falls back to the cover image, then to the generated card. 1200×630 works everywhere.',
      },
    },
    {
      name: 'keywords',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Comma-separated. Not a ranking signal — it only feeds the article structured data.',
      },
    },
    {
      name: 'canonicalUrl',
      type: 'text',
      admin: {
        description:
          'Only for content published elsewhere first. Points the canonical at that original.',
      },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Keeps the page out of search results. It stays reachable and is dropped from the sitemap.',
      },
    },
  ],
}
