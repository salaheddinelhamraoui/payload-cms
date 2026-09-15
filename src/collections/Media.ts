import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'What the image shows, for screen readers and image search. Describe it — do not repeat the post title.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: { description: 'Optional visible caption printed under the image.' },
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
    // Held to the formats every target browser decodes. Without sharp on
    // Workers nothing is converted server-side, so an upload is served as it
    // arrives — the frontend's image optimiser is what produces AVIF/WebP.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
  },
}
