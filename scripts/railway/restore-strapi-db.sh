#!/usr/bin/env bash
# Restore a Strapi schema dump into the Railway PostgreSQL.
#
# Usage:
#   TARGET_DATABASE_URL="postgres://...railway..." ./scripts/railway/restore-strapi-db.sh [input-file]
#
# The input file defaults to strapi-dump.sql in the current directory.
# IMPORTANT: run this BEFORE the Strapi service boots for the first time
# (or right after, while no one is editing content). The dump uses
# --clean --if-exists, so re-running it is safe.
set -euo pipefail

: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL to the target (Railway) PostgreSQL connection string}"

IN="${1:-strapi-dump.sql}"

if [ ! -f "$IN" ]; then
  echo "Input file not found: $IN" >&2
  exit 1
fi

echo "Restoring $IN into target database..."
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$IN"

echo "Done. Strapi content restored."
