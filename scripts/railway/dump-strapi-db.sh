#!/usr/bin/env bash
# Dump the Strapi content (the `strapi` schema) from the current Replit PostgreSQL.
#
# Usage:
#   SOURCE_DATABASE_URL="postgres://...replit..." ./scripts/railway/dump-strapi-db.sh [output-file]
#
# The output file defaults to strapi-dump.sql in the current directory.
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL to the source (Replit) PostgreSQL connection string}"

OUT="${1:-strapi-dump.sql}"

echo "Dumping 'strapi' schema from source database..."
pg_dump "$SOURCE_DATABASE_URL" \
  --schema=strapi \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  -f "$OUT"

echo "Done. Wrote $(du -h "$OUT" | cut -f1) to $OUT"
