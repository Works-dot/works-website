---
name: Railway deploy & auto-rebuild for Works. website
description: How the Works. monorepo is hosted on Railway and how Strapi triggers website rebuilds on content changes.
---

## Hosting topology
- Works. website (React+Vite **SSG**) and Strapi v5 CMS are deployed as two separate Railway services in the same Railway project/environment (production). GitHub repo: `Works-dot/works-website`, branch `main`. Pushing to `main` auto-deploys both.
- Website is **static**: content is baked at build time by `artifacts/works-website/scripts/fetch-strapi-data.mjs` (uses `STRAPI_URL` env, appends `/strapi/api`). New CMS content only appears after a website **rebuild** (the `buildCommand` re-runs fetch-strapi-data).

## Triggering a website rebuild from outside
- Railway has **no inbound deploy-hook URL**. Use the GraphQL API.
  - Endpoint: `https://backboard.railway.app/graphql/v2`, auth `Authorization: Bearer <API token>`.
  - Mutation: `serviceInstanceRedeploy(environmentId: String!, serviceId: String!)` — **both args required**. This RE-RUNS the build (buildCommand), not just a container restart. (`serviceInstanceRestart` = restart only, no rebuild.)
  - `environmentId` is auto-injected into every Railway deployment as `RAILWAY_ENVIRONMENT_ID`; since both services share the environment, Strapi can reuse its own. Fallback: query `service(id){ serviceInstances { edges { node { environmentId } } } }`.

## Auto-rebuild implementation (Strapi side)
- `artifacts/strapi/src/website-rebuild.ts` + wiring in `src/index.ts` bootstrap. Two triggers, both debounced (default 45s) → redeploy mutation:
  1. **Media**: `strapi.db.lifecycles` filtered to `plugin::upload.file` only (uploads/deletes have no draft&publish, affect live site immediately).
  2. **Content**: `strapi.documents.use()` middleware. The public site shows only PUBLISHED content, so for draft&publish types it triggers ONLY on `publish`/`unpublish` actions (NOT plain draft `update`/`create`). For non-draft&publish types (e.g. `tag`, `client`) it triggers on `create`/`update`/`delete`.
- **Why the documents middleware (not db lifecycles) for content:** db `afterUpdate` fires on every draft save and can't cleanly distinguish a draft save from a publish; the document service middleware exposes the semantic action (`publish`/`unpublish`) directly. ctx shape: `{ uid, contentType, action, params }`; `ctx.contentType.options.draftAndPublish` flags D&P. Middleware runs before the method, so `await next()` then schedule.
- Migrations call documents `update` with `status:"published"` (action stays `update`, not `publish`) so they don't trigger content rebuilds even on D&P types.
- Required Railway Variables on the **Strapi** service: `WEBSITE_REBUILD_TOKEN` (Railway API token), `WEBSITE_REBUILD_SERVICE_ID` (the website's service id). Optional overrides: `WEBSITE_REBUILD_ENVIRONMENT_ID`, `WEBSITE_REBUILD_DEBOUNCE_MS`. No-op (logs `[auto-rebuild] disabled`) if token or serviceId is unset — so local/dev never calls Railway. Legacy `RAILWAY_API_TOKEN` / `RAILWAY_WEBSITE_SERVICE_ID` / `RAILWAY_WEBSITE_ENVIRONMENT_ID` / `RAILWAY_REBUILD_DEBOUNCE_MS` are still read as fallbacks (for non-Railway/local use only).
- **CRITICAL — Railway hides `RAILWAY_`-prefixed user vars:** Railway reserves the `RAILWAY_` prefix for its own platform vars and does NOT inject user-defined `RAILWAY_*` variables into the running container, so `process.env.RAILWAY_API_TOKEN` etc. read as empty even when the user set them in the dashboard. **Any config the user must set on Railway must use a non-`RAILWAY_` name.** Exception: `RAILWAY_ENVIRONMENT_ID` (and other genuine platform vars like `RAILWAY_PUBLIC_DOMAIN`) ARE provided by Railway and safe to read.
- **Why the `ready` gate:** bootstrap migrations write content via the documents API, which fires lifecycles. A `ready` flag stays false until migrations finish (`markWebsiteAutoRebuildReady`), so a restart doesn't trigger a rebuild storm.
- **Why `.finally()` (not `.then()`) sets ready:** keep auto-rebuild alive even if a one-time migration fails — otherwise a transient migration error would silently disable the feature forever for a non-technical user. Partial-migration risk is low (rebuild only fetches published content).
- knex raw writes (e.g. `syncServiceTitles`) do NOT fire lifecycles; only documents API / entity writes do.
