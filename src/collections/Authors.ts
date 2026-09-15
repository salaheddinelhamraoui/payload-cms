import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

/**
 * Bylines, kept separate from `users`.
 *
 * A byline is public content — name, photo, biography, profile links — while a
 * user is a login. Tying them together would mean every person who writes needs
 * an account and every account leaks a name to the public API, so they stay
 * apart.
 *
 * `links` exists for the `sameAs` array in the author's structured data, which
 * is how a search engine connects a byline here to the same person elsewhere.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'updatedAt'],
    group: 'Blog',
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
    {
      name: 'role',
      type: 'text',
      localized: true,
      admin: { description: 'Shown under the name, e.g. "Streaming editor".' },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'links',
      type: 'array',
      labels: { singular: 'Profile link', plural: 'Profile links' },
      admin: {
        description: 'Public profiles for this person — feeds the author schema.',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
