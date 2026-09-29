import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import { type Site, siteByValue, sites } from '../sites'

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
async function ping(req: PayloadRequest, site: Site, tags: string[]): Promise<void> {
  const endpoint = site.revalidateUrl
  const secret = site.revalidateSecret

  if (!endpoint || !secret) {
    req.payload.logger.debug(`${site.label}: revalidate URL or secret unset — skipping revalidation.`)
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
        `${site.label}: revalidation rejected with ${response.status}: ${await response.text()}`,
      )
    }
  } catch (error) {
    req.payload.logger.warn(`${site.label}: revalidation request failed: ${(error as Error).message}`)
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

/**
 * Which frontends a document shows up on.
 *
 * Posts carry a `sites` list; categories and authors do not, because they are
 * shared and can appear on every site. Both the new and the previous list
 * count, so taking a post off a site purges that site too — otherwise it would
 * keep serving the post until its timed revalidation.
 */
function sitesFor(...docs: unknown[]): Site[] {
  const lists = docs.map((doc) => (doc as { sites?: unknown } | undefined)?.sites)
  if (!lists.some(Array.isArray)) return sites

  const values = new Set(lists.flatMap((list) => (Array.isArray(list) ? list : [])))
  return [...values].map(siteByValue).filter((site): site is Site => Boolean(site))
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
  // Drafts are invisible to the public site, so purging for them would only
  // throw away a warm cache. Publishing flips `_status` and lands here again.
  if (doc?._status === 'draft') return doc

  const tags = tagsFor(collection.slug, doc?.id)
  for (const site of sitesFor(doc, previousDoc)) void ping(req, site, tags)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, collection, req }) => {
  const tags = tagsFor(collection.slug, doc?.id)
  for (const site of sitesFor(doc)) void ping(req, site, tags)
  return doc
}
