---
name: Strapi v5 admin extensions (routes & homepage widgets)
description: Non-obvious constraints for adding admin-authenticated endpoints and homepage widgets to the Works. Strapi CMS.
---

## Admin-authenticated custom endpoints
- Routes under `src/api/<name>/routes/` are **always forced to `type: 'content-api'`** by core (`registerAPIRoutes` overwrites `router.type = 'content-api'`). A `type: 'admin'` field in the route file is silently ignored — the route ends up at `/api/...` guarded by users-permissions, which the admin panel's JWT can't satisfy.
- **Why it matters:** the admin panel (`useFetchClient`) sends an *admin* session token, validated only by the `admin` auth strategy. Content-api routes reject it.
- **How to add an admin endpoint:** register it programmatically in the app `register({ strapi })` lifecycle (in `src/index.ts`) via `strapi.server.routes({ type: 'admin', routes: [...] })`. The admin API router has prefix `''`, so paths mount at root (e.g. `/website-rebuild/status`). Handlers may be inline functions `(ctx) => {...}` (core `getAction` accepts function/array handlers, not just `"controller.action"` strings).
- An admin route with no `config.auth.scope`/permissions only requires an *authenticated active admin* — exactly right for "any logged-in editor can use it". Unauthenticated calls return 401 (not 404), which confirms the route mounted with auth.

## Homepage widgets (Strapi >= 5.13, we run 5.40)
- Register in the admin entry (`src/admin/app.ts`) `register(app)` via `app.widgets.register({ icon, title, component, id })`. Omit `pluginId` so the uid becomes `global::<id>` (passing `pluginId` makes it `plugin::<pluginId>.<id>`). `icon`, `title`, `component` are required (invariant-checked).
- Widget body: import `Widget` (Loading/Error/NoData helpers) and `useFetchClient` from `@strapi/strapi/admin`; layout from `@strapi/design-system`; icons from `@strapi/icons`.
- **Two build gotchas (both needed or the admin build fails):**
  1. Add `@strapi/design-system` and `@strapi/icons` as **direct deps** of the strapi package. They're only transitive otherwise and the admin Vite/Rollup build can't resolve them ("Rollup failed to resolve import").
  2. Add `src/admin` to `exclude` in the strapi `tsconfig.json`. Admin TSX/icon imports break the server `tsc` (no `--jsx`, can't resolve `@strapi/icons`); the admin is built separately by Vite anyway.
