---
name: Strapi component updates replace the whole component
description: Data-loss trap when updating a Strapi v5 component field (e.g. service.general) via the documents API in migrations.
---

Updating a component field via `strapi.documents(...).update({ data: { general: {...} } })` **replaces the entire component** — any media/relation not included is silently dropped.

**Why:** a migration adding `general.kicker` spread `svc.general` fetched with `populate: ["general"]` (media not populated), which wiped `general.icon` on all services; the homepage listing lost its icons.

**How to apply:** in any migration touching a component, populate its media/nested fields (`"general.icon"`, `"general.heroImage"`) and pass them back by id in the update payload. Also double-check migration store flag keys match between `get` and `set` (a v1/v2 drift made a migration rerun on every boot).
