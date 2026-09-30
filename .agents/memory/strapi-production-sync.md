---
name: Strapi production-to-development sync
description: Compatibility and media-completeness rules for restoring the Railway Strapi snapshot into Replit development.
---

Use a source-version `pg_dump` for Railway PostgreSQL, preserve its immutable custom-format dump, and generate a separate target-compatible SQL restore artifact when development runs an older PostgreSQL major version.

**Why:** A PostgreSQL 18 dump restored into PostgreSQL 16 failed on the PG17+ `SET transaction_timeout = 0` session statement. Removing only that statement from a generated compatibility copy produced a complete restore; the immutable source dump remained unchanged.

**How to apply:** Match `pg_dump` to the source server, test the compatibility SQL in an isolated UTF-8 target-version server, and verify table counts and constraints before touching development.

Treat Railway Strapi media as the union of database-referenced upload URLs and the build-seeded `public/uploads` snapshot; do not replace development uploads from the `files` table manifest alone.

**Why:** Railway startup copies missing build-seed files into its persistent uploads volume. CMS content can still contain direct URLs to those seed files even when no current `files` row exists, so a DB-only media mirror caused valid website images to return 404.

**How to apply:** Download originals and generated formats from the production DB manifest, merge in the build seed without overwriting production-downloaded files, checksum the union, and run a fresh browser pass that watches failed media requests.

Never preserve production Strapi admin identities by truncating `admin_users` or `admin_roles` with `CASCADE` after a full restore.

**Why:** content rows reference admin users through creator/updater foreign keys, so the cascade can empty the content, component-link, upload, locale, and user-permission tables. A complete source snapshot must then be reapplied.

**How to apply:** compare admin user/role checksums before restoring. If identities match, keep the source identities and restore only production-specific permission rows/link rows if necessary; otherwise use a tested non-cascading mapping strategy in an isolated restore first.