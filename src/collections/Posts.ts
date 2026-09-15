import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  LinkFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated, publishedOrSignedIn } from '../access'
import { slugField } from '../fields/slug'
import { seoField } from '../fields/seo'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { readingMinutes } from '../lib/lexical-text'

/**
 * Keeps the "5 min read" label honest without asking anyone to count words.
 *
 * Computed on save rather than at render time so the blog index can show it
 * without fetching the body of every post it lists.
 */
const setReadingMinutes: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.content) data.readingMinutes = readingMinutes(data.content)
  return data
}

/**
 * Stamps the publication date the first time a post goes live.
 *
 * `publishedAt` is the date the public site shows and sorts by, and it is also
 * what gates scheduled posts, so it must not silently move every time someone
 * fixes a typo. Set it once, then leave it to the editor.
 */
const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data?._status === 'published' && !data.publishedAt && !originalDoc?.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: publishedOrSignedIn,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'],
    group: 'Blog',
    preview: (doc, { locale }) => {
      const base = process.env.FRONTEND_URL
      if (!base || !doc?.slug) return null
      return `${base}/${locale || 'nl'}/blog/${doc.slug}`
    },
  },
  // Drafts give editors somewhere to work that the public API cannot read, and
  // versions make an accidental overwrite recoverable rather than final.
  versions: {
    // Autosave is deliberately slower than Payload's default: every tick is a
    // write, D1 bills for writes, and nine locales multiply them. Two seconds
    // still means nobody loses a paragraph.
    drafts: { autosave: { interval: 2000 } },
    maxPerDoc: 25,
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeChange: [setPublishedAt, setReadingMinutes],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'The <h1> and the default <title>. Lead with the subject, not the brand — the brand is appended automatically.',
      },
    },
    slugField('title'),
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 300,
      admin: {
        description:
          'One or two sentences. Shown on the blog index and used as the meta description unless the SEO tab overrides it.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  // The page already owns the <h1>; a second one in the body
                  // muddles the document outline for no gain. Everything here
                  // nests under it.
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                  // Internal links are the cheapest ranking work available, so
                  // linking post-to-post is a first-class action rather than a
                  // pasted URL an editor has to keep correct by hand.
                  LinkFeature({
                    enabledCollections: ['posts'],
                    fields: ({ defaultFields }) => [
                      ...defaultFields,
                      {
                        name: 'rel',
                        type: 'select',
                        hasMany: true,
                        options: ['nofollow', 'sponsored', 'ugc'],
                        admin: {
                          description:
                            'Leave empty for ordinary links. Set nofollow or sponsored on paid or untrusted destinations.',
                        },
                      },
                    ],
                  }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                  HorizontalRuleFeature(),
                ],
              }),
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Shown at the top of the post and used as its social card. 16:9 crops best.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Set it in the future and publish: the post stays hidden until the date arrives.',
      },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      localized: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Counted from the body on save.',
      },
    },
  ],
}
