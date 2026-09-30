## Publishing a migration must not promote unrelated drafts

Before a content migration publishes a Strapi document, compare its draft and published non-target fields, including nested media, SEO and relations. Abort on pending changes outside the migration's scope.

**Why:** updating only translated fields in a draft is not an isolated publication: Strapi publishes the entire draft, including an editor's unrelated pending work.

**How to apply:** populate the full affected schema, normalize only version-specific bookkeeping, and test divergent draft media and metadata—not just identical draft/published fixtures.

---
name: Strapi component updates replace the whole component
description: Data-loss trap when updating a Strapi v5 component field (e.g. service.general) via the documents API in migrations.
---

Updating a component field via `strapi.documents(...).update({ data: { general: {...} } })` **replaces the entire component** — any media/relation not included is silently dropped.

**Why:** a migration adding `general.kicker` spread `svc.general` fetched with `populate: ["general"]` (media not populated), which wiped `general.icon` on all services; the homepage listing lost its icons.

**How to apply:** in any migration touching a component, populate its media/nested fields (`"general.icon"`, `"general.heroImage"`) and pass them back by media id in the update payload. Do not include the component row's own `id`: Strapi v5 can reject it as “not related to the entity.” Publishing creates new technical row/component IDs and timestamps, so compare semantic content with the same populate shape and ignore those system fields. Also double-check migration store flag keys match between `get` and `set` (a v1/v2 drift made a migration rerun on every boot).

## A targeted update does not make publication targeted

`documents.publish()` publishes the entire draft, even after an update containing only one component.

**Why:** a scoped production content release can otherwise publish unrelated pending editorial changes. Checking unrelated fields only after publication detects damage too late.

**How to apply:** before writes and immediately before publication, compare draft/published semantic content outside the target component against the pre-change snapshot. Reject mismatches, await asynchronous guards, and verify the exact intended component (including media, order, heading, and title-keyed descriptions) before publishing.
