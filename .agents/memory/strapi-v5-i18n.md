---
name: Strapi v5 i18n rollout safety
description: Non-obvious version and migration-order constraints for safely introducing native localization.
---

Strapi v5 bundles `@strapi/i18n`; do not install the obsolete v4 package `@strapi/plugin-i18n`. The content type and every independently translated field or component container need `pluginOptions.i18n.localized: true`.

**Why:** Existing rows are assigned to whichever locale Strapi considers default on the first localized schema boot. A restored non-localized database can already contain the initial English locale and default setting, which would silently mislabel Hungarian content.

**How to apply:** Before the first localized development boot, verify the database is not production, make HU the default, then enable localized schemas. Annotate translated fields and their component/dynamic-zone containers; leave deliberately shared fields unannotated. Development-only rollout guards must enable on explicit development rather than merely disabling on production, and database identity checks must fail closed.

To add a locale to an existing Strapi v5 document, call the document service's
`update()` with the existing `documentId` and the new locale, even when that
locale does not exist yet. Do not use `create()` for this.

**Why:** In Strapi 5.40, `create()` generates a fresh `documentId` even when an
existing one is supplied, producing a separate document rather than a
localization. This breaks localized relation mapping while appearing to create
valid locale rows.

**How to apply:** Import localizations with
`update({ documentId, locale, data })`, then verify the returned and persisted
`documentId` matches the source document. Use one transaction so a failed
relation pass rolls back every newly created locale row.