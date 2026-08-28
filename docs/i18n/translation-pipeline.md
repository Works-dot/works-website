# Development translation pipeline

These commands are development-only. Every command requires the active
`STRAPI_DATABASE_URL` (or `DATABASE_URL`), requires
`PRODUCTION_DATABASE_URL`, and refuses to run when their normalized database
identities match. They initialize Strapi programmatically without running the
application's mutating bootstrap/seed lifecycle.

```bash
cd artifacts/strapi

# Read-only: produce the translator document and immutable HU baseline.
pnpm translations:export -- \
  --output translation/hu-to-en.json \
  --baseline translation/hu-baseline.json

# Translate all text fields through Replit AI Integrations (no CMS writes).
pnpm translations:translate -- \
  --input translation/hu-to-en.json \
  --output translation/reviewed-en.json \
  --report translation/review-required.md

# After the translation fills only the `en` values, resolve and validate everything.
pnpm translations:import -- \
  --input translation/reviewed-en.json \
  --baseline translation/hu-baseline.json \
  --dry-run

# Validate the reviewed file, HU baseline, and current EN database state.
pnpm translations:validate -- \
  --input translation/reviewed-en.json \
  --baseline translation/hu-baseline.json
```

The export has stable `documentId` relation references and media
`documentId`/hash/URL references, but no database or component IDs. Component
and dynamic-zone order is significant and must not be changed. The importer
rebuilds complete component payloads because Strapi replaces components on
update; localized values come from the reviewed file while shared values and
media are re-read from the current, checksum-verified HU draft.

## Applying an import

Do not apply until the dry run passes. First take both backups:

```bash
pg_dump -Fc "$DATABASE_URL" > "pre_en_import_$(date +%Y%m%d_%H%M%S).dump"
pnpm strapi export --no-encrypt -f "pre_en_import_$(date +%Y%m%d_%H%M%S).tar.gz"
```

Then run:

```bash
pnpm translations:import -- \
  --input translation/reviewed-en.json \
  --baseline translation/hu-baseline.json \
  --apply --backup-confirmed
```

The importer is idempotent, creates or updates by HU `documentId`, maps
localized relations to EN targets in a second pass, runs in one database
transaction, and always writes draft status. It never calls publish. Restore
the PostgreSQL dump if the post-import validation fails.

Strapi v5 localizations are created with
`documents(uid).update({ documentId, locale: "en", ... })`. Do not replace this
with `create()`: Strapi ignores a supplied `documentId` on create and starts a
separate document instead of adding a locale.

`tag` has `draftAndPublish: false`, so its EN locale rows are technically
published as soon as they are imported. The global English-locale middleware
therefore returns 404 for anonymous `locale=en` and `locale=all` Content API
requests while the published Global Settings gate is not literally `true`.

The current pipeline ends with complete machine-translated drafts in
development. Editorial/legal approval, approved localized legal PDFs, frontend
routing and public enablement are later pre-publication stages; they are
deliberately listed in `translation/review-required.md` without blocking this
development import.