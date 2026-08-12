---
name: Squarespace blog migration
description: Decisions from migrating old worksdot.hu blog into Strapi
---
- The Squarespace export contains 8 template placeholder posts ("Blog Post Title One…", 2019, two with spaces in slugs) — excluded by the extractor; 25 real articles migrated & published.
- Strapi component text columns are varchar(255) (e.g. image caption) — long values must be truncated or create() fails at the DB layer.
- Migration is publish-idempotent: skip slugs with a published version, publish leftover drafts, create+publish new. Seed no longer creates or deletes blog posts.
