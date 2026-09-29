/**
 * The public sites this CMS publishes to.
 *
 * One dashboard, one set of posts, several frontends: each post says which
 * sites it belongs to, and each frontend asks only for its own
 * (`where[sites][in]=<value>`). Categories and authors are shared.
 *
 * Devora keeps the original `FRONTEND_*` variable names so existing Worker
 * secrets keep working; every other site reads its own prefix.
 */
export interface Site {
  value: string
  label: string
  /** Origin of the public site: preview links, CORS and CSRF. */
  url: string | undefined
  /** Endpoint that purges the site's cache, and the secret it checks. */
  revalidateUrl: string | undefined
  revalidateSecret: string | undefined
}

export const sites: Site[] = [
  {
    value: 'devoratv',
    label: 'Devora TV',
    url: process.env.FRONTEND_URL,
    revalidateUrl: process.env.FRONTEND_REVALIDATE_URL,
    revalidateSecret: process.env.FRONTEND_REVALIDATE_SECRET,
  },
  {
    value: 'genovatv',
    label: 'Genova TV',
    url: process.env.GENOVA_FRONTEND_URL,
    revalidateUrl: process.env.GENOVA_FRONTEND_REVALIDATE_URL,
    revalidateSecret: process.env.GENOVA_FRONTEND_REVALIDATE_SECRET,
  },
]

export const siteOptions = sites.map(({ value, label }) => ({ value, label }))

export const defaultSite = 'devoratv'

export function siteByValue(value: unknown): Site | undefined {
  return sites.find((site) => site.value === value)
}

/** Every configured site origin, for the CORS and CSRF allow-lists. */
export const siteOrigins = sites.map((site) => site.url).filter((url): url is string => Boolean(url))
