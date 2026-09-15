import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

/**
 * Tells the public site that a document changed.
 *
 * The frontend prerenders every blog page, so without this a published post
 * would not appear until the next deploy. Rather than dropping to on-demand
 * rendering — which costs the site its static-everything guarantee and the
 * latency that comes with it — we keep the pages static and purge them by tag
 * when the CMS says they are stale.
 *
 * Failure is logged and swallowed on purpose: the editor's save has already
 * succeeded in the database, and turning a temporarily unreachable frontend
 * into a failed save would be the worse outcome. The pages' own time-based
 * revalidation is the backstop.
 */
async function ping(req: PayloadRequest, tags: string[]): Promise<void> {
  const endpoint = process.env.FRONTEND_REVALIDATE_URL
  const secret = process.env.FRONTEND_REVALIDATE_SECRET

  if (!endpoint || !secret) {
    req.payload.logger.debug(
      'FRONTEND_REVALIDATE_URL or FRONTEND_REVALIDATE_SECRET unset — skipping revalidation.',
    )
    return
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      req.payload.logger.warn(
        `Revalidation rejected with ${response.status}: ${await response.text()}`,
      )
    }
  } catch (error) {
    req.payload.logger.warn(`Revalidation request failed: ${(error as Error).message}`)
  }
}

/**
 * Tags to purge for a blog document.
 *
 * `blog` covers the index, the sitemap and every "related posts" strip, which
 * any change can affect. The per-document tag keeps a single post's page from
 * being the only thing that has to wait for the next timed revalidation.
 */
function tagsFor(collection: string, id: unknown): string[] {
  return ['blog', `${collection}:${id}`]
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, collection, req }) => {
  // Drafts are invisible to the public site, so purging for them would only
  // throw away a warm cache. Publishing flips `_status` and lands here again.
  if (doc?._status === 'draft') return doc

  void ping(req, tagsFor(collection.slug, doc?.id))
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, collection, req }) => {
  void ping(req, tagsFor(collection.slug, doc?.id))
  return doc
}
