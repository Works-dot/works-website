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

## Watch paths gotcha
- The website Railway service only redeploys when files under `artifacts/works-website` change; commits touching only `artifacts/strapi` never trigger a website build — to force a website rebuild via git, the commit must touch the website dir. Bootstrap migrations run before the auto-rebuild ready gate opens, so content they change must explicitly request a post-bootstrap rebuild.

## Localized CMS rollout order
For a release that changes both the production Strapi localization schema and the website's bilingual cache fetch, deploy sequentially: restore the already-localized DB, deploy Strapi, verify the public API returns the requested non-default `locale`, then deploy the website.

**Why:** Railway builds both services concurrently from one commit. The website can reach the old Strapi schema first and fail or bake the wrong locale. A retry commit with an identical tree is skipped as “watched paths not modified.”

**How to apply:** use separate fast-forward commits, or trigger `serviceInstanceRedeploy` after Strapi is live. A Git retry must contain a real change under `artifacts/works-website`, and success must be read from the exact `@workspace/works-website` status context.

## Browser tests outside the deploy critical path
Keep Railway's website build path to the strict production Strapi fetch followed by the normal Vite/SSG build. Run the Playwright production regression suite locally or in a dedicated CI environment, not as a Railway Nixpacks build gate.

**Why:** Nixpacks can fail while installing or launching Chromium even when the same strict production-data build and Playwright suite pass locally. Coupling browser runtime dependencies to deploy blocked a valid website release.

**How to apply:** validate with the Playwright suite before publishing, but do not replace Railway's normal build command with `test:production`.

## Launch health and image optimization boundaries
Keep website readiness independent from live CMS, Mailchimp, and Resend availability, and keep CMS image optimization optional when the local upload snapshot is absent.

**Why:** the published website serves baked content even during upstream outages. The local workspace can contain historical media that was intentionally excluded from website-only GitHub releases; requiring that snapshot would break otherwise valid clean Railway builds.

**How to apply:** validate the immutable static build once at process startup, monitor submission services separately, and preserve original proxied image URLs for any media without generated variants. Compare deployment image gains only against the media actually available in that deployment.

Release verification must reconstruct the remote base plus the exact release allowlist, not reuse workspace build results based only on application-source hashes.

**Why:** prebuild regenerates the image manifest from available uploads. Excluding historical uploads changes the built artifact even when all application source hashes match the previously tested workspace.

**How to apply:** build with the release's actual upload subset, record missing-source coverage, and explicitly exclude full CMS optimization claims unless those sources are supplied. A clean patch-apply check alone does not prove build equivalence.

## Content updates from an external maintenance process

Publishing through a maintenance process connected to the production database does not trigger the running Railway Strapi process's in-memory auto-rebuild hooks.

**Why:** Documents middleware runs in the process making the call; database changes alone do not notify the other process. A successful production CMS update can therefore leave the static website stale.

**How to apply:** include a separately verified website rebuild in any external content-maintenance operation. Prefer the supported rebuild API; an actual production-cache change committed under the website watch path can also trigger the existing GitHub pipeline. Do not report the live website fixed from CMS API verification alone.

## Content refresh does not prove a new code release

Treat CMS-triggered content rebuilds and deployment of the latest GitHub source as separate facts.

**Why:** All nine newly published Hungarian posts appeared on the live site after CMS-triggered rebuilding while Organization fields and additional schema types already on GitHub remained absent. Successful content refresh therefore did not establish that the newest frontend source was running.

**How to apply:** inspect live raw HTML for a code-specific change as well as the expected CMS content. When new code is missing, guide the user to deploy the latest commit for the website service, not merely repeat the old deployment or restart Strapi. Do not infer release success or failure solely from absent GitHub commit statuses.

## Schema success is not content readiness

Verify required published field values before releasing a website that makes them mandatory; a successful Strapi schema deployment alone is insufficient.

**Why:** The legal HTML rollout deployed six new fields successfully but left all six empty in production. The website then failed prerender, blocking an unrelated urgent career fix too.

**How to apply:** Stage schema, backed-up non-overwriting content initialization, published API verification, then website build. Use the supported CMS admin API for production content changes; do not bypass development-only script guards or disable the website's content validation.
