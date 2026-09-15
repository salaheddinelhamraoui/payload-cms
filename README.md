# Devora TV — Payload CMS

Payload 3 on Cloudflare Workers (D1 + R2), serving the blog for the `devora-tv`
frontend in this repo.

## Collections

| Collection | What it holds |
| --- | --- |
| `posts` | Blog posts. Localised, drafted, versioned. |
| `categories` | Topics. Rendered as badges and as `articleSection`. |
| `authors` | Public bylines, separate from `users` (logins). |
| `media` | Uploads, served from R2. |
| `users` | Admin accounts. |

## Things worth knowing before editing

**Nine locales.** `src/locales.ts` mirrors the frontend's `src/i18n/config.ts`.
They must stay identical. The admin panel shows the Dutch original next to an
empty translation (`fallback: true`), but the frontend asks for
`fallback-locale=none` and therefore never receives it — a post with no German
translation is simply absent from the German blog rather than serving Dutch
copy under a German URL.

**Slugs are per-locale.** `/de/blog/iptv-auf-fire-tv-einrichten`, not the Dutch
spelling under a German path. Leave the slug blank and it is generated from
that locale's title. Changing a slug changes a live URL — the frontend builds
`hreflang` from the whole slug map, so there is nothing else to update, but the
old URL will 404.

**Publishing is gated twice.** A post is public only when `_status` is
`published` *and* `publishedAt` has passed. Set a future date and publish to
schedule it.

**Saving purges the frontend cache.** `afterChange` posts to
`FRONTEND_REVALIDATE_URL`. If that is unreachable the save still succeeds and
the hook logs a warning — the frontend re-fetches hourly regardless.

## Setup

```bash
pnpm install --ignore-workspace
cp .env.example .env          # fill in PAYLOAD_SECRET: openssl rand -hex 32
pnpm generate:types
pnpm payload migrate:create   # schema for posts/categories/authors + localisation
pnpm dev
```

The admin panel is at `/admin`. Create a user, then an author, then a post.

## Deploying

```bash
pnpm deploy
```

Runs migrations against D1 and deploys the Worker. Set `FRONTEND_URL`,
`FRONTEND_REVALIDATE_URL` and `FRONTEND_REVALIDATE_SECRET` as Worker secrets —
the last must match `REVALIDATE_SECRET` on the frontend.

## Commands

| Command | |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm generate:types` | Regenerate `payload-types.ts` and Cloudflare types |
| `pnpm payload migrate:create` | New migration after a schema change |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest + Playwright |
