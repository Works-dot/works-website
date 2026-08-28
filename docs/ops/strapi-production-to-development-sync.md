# Strapi production → development sync report

**Sync date:** 2026-08-28  
**Direction:** Railway production → Replit development  
**Production access:** read-only for the entire operation

## Environment

- Source database: Railway PostgreSQL 18.4, `strapi` schema
- Target database: Replit PostgreSQL 16.10, `strapi` schema
- Strapi version after startup: 5.40.0
- Media provider represented by the source database: local

## Safety backups

The backups below were created before the development restore and verified with SHA-256 checksums:

| Backup | Path | Size |
|---|---|---:|
| Previous development Strapi schema | `/tmp/works-strapi-sync-120/dev-strapi-pre-sync.dump` | 642 KB |
| Previous development uploads | `/tmp/works-strapi-sync-120/dev-uploads-pre-sync.tar.gz` | 90 MB |
| Immutable production Strapi snapshot | `/tmp/works-strapi-sync-120/prod-strapi-source.dump` | 699 KB |
| PG16-compatible restore SQL | `/tmp/works-strapi-sync-120/prod-strapi-pg16-compatible.sql` | 2.0 MB |
| Production media archive | `/tmp/works-strapi-sync-120/prod-media-source.tar.gz` | 223 MB |

These paths are temporary container storage and are intended for immediate rollback and verification. They must be copied to approved encrypted storage if long-term retention is required.

## PostgreSQL compatibility

The source is PostgreSQL 18 while the target is PostgreSQL 16. The production snapshot was made with `pg_dump` 18.6. A separate plain SQL restore file was generated from that immutable custom-format dump. The only PG18-only statement removed from the compatibility copy was:

```sql
SET transaction_timeout = 0;
```

The resulting SQL was restored into an isolated UTF-8 PostgreSQL 16 instance before the real development restore. The test restored all 112 Strapi tables and reported zero invalid constraints.

## Media sync

- Production media records: 439
- Original and generated-format URLs in the database manifest: 1,504
- Successfully downloaded from production and SHA-256 verified: 1,504
- Build-seeded upload files: 958
- Overlapping seed/database files, verified byte-identical: 325
- Files present only in the build seed: 633
- Final merged development upload files: 2,137
- Final development upload size: 229 MB

Railway media storage has two layers: the persistent upload volume and the build's `public/uploads` seed snapshot. `seed-uploads.mjs` copies seed files that are missing from the volume without replacing existing files. Some CMS content contains direct upload URLs for seed files that are not represented by current `files` table rows, so both layers are required for a faithful development mirror.

The source database media contains one unassociated DOCX upload. It is retained locally because this was a complete media sync, but a local Git exclusion prevents DOCX uploads from being committed.

## Bootstrap protection

The current development bootstrap would otherwise add two services and backfill legal PDFs because production does not contain three migration guard records used by the current code. After reapplying the clean production snapshot, three development-only internal guard records were added:

- `plugin_migrations_service_catalog_seed_v1`
- `plugin_migrations_service_catalog_names_order_v1`
- `plugin_migrations_legal_documents_seed_v2`

No visitor-facing content was changed by these guards. On the final startup, all three migrations were skipped.

## Final verification

- Strapi starts successfully and reports PostgreSQL as its database.
- Admin route, proxied API and a representative media URL return HTTP 200.
- All 112 snapshot tables exist in development.
- Compared with the immutable production snapshot, every visitor-content and media table has an identical row count and full-row hash.
- The only expected internal differences are:
  - three development-only bootstrap guard rows in `strapi_core_store_settings`;
  - the environment-generated Strapi schema-cache row in `strapi_database_schema`.
- Published API totals after startup:
  - blog posts: 25
  - projects: 21
  - services: 6
  - career positions: 1
  - team members: 24
  - tags: 11
  - homepage, about, contact, career, blog, projects and global-setting single types: present
- A fresh browser run across the homepage, projects listing/detail and blog listing/detail completed with an empty failed-request list, no media 404s and no browser console errors.

## Immediate rollback

Stop the development Strapi workflow before rollback.

Restore the previous development database:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --dbname="$DATABASE_URL" \
  /tmp/works-strapi-sync-120/dev-strapi-pre-sync.dump
```

Restore the previous development media:

```bash
rm -rf artifacts/strapi/public/uploads
tar -C artifacts/strapi/public \
  -xzf /tmp/works-strapi-sync-120/dev-uploads-pre-sync.tar.gz
```

Restart the managed `artifacts/strapi: web` workflow and repeat the API/media checks.