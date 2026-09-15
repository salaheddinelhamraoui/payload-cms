import type { Access, FieldAccess } from 'payload'

/** Public read. Used for the reference collections the blog renders. */
export const anyone: Access = () => true

/** Any signed-in admin user. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const authenticatedField: FieldAccess = ({ req: { user } }) => Boolean(user)

/**
 * What the public API is allowed to see in a collection with drafts.
 *
 * Signed-in users see everything, so the admin panel and draft previews keep
 * working. Everyone else gets published documents whose `publishedAt` has
 * actually arrived — that second clause is what makes scheduling work: set a
 * future date, publish, and the post stays invisible until then.
 *
 * Returning a query rather than `false` matters — Payload folds it into the
 * `where` of every find, so an unpublished slug 404s instead of leaking.
 */
export const publishedOrSignedIn: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    and: [
      { _status: { equals: 'published' } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ],
  }
}
