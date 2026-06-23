---
name: Strapi service seed content sources
description: Two separate seed sources for services and which one carries the activity/benefit/tool TEXT
---

The Works. Strapi has TWO independent seed sources for the `service` content type that carry DIFFERENT fields — this split is the main gotcha:

- `scripts/seed.mjs` (manual, needs `STRAPI_SEED_TOKEN`) historically was the ONLY place holding the actual TEXT of the service sub-sections (activities/benefits/tools).
- `SERVICE_SEED_DATA` in `src/index.ts` drives the auto-running bootstrap migrations, but historically held only icon names + process steps, NOT that text.

**Why sections can render empty:** the bootstrap migration that "sets up" service sections only re-decorates *already-existing* activity/benefit items with icons; it never creates the text. So any service whose sections are empty in the DB stays empty. The site then shows the hardcoded fallback (works-website data/fallback.ts), which only appears when Strapi is unreachable — masking the fact that the CMS itself is empty.

**Durable rules when seeding/backfilling service content:**
- Put text that must auto-apply everywhere (incl. Railway) into `SERVICE_SEED_DATA`, not only seed.mjs.
- Gate each bootstrap migration behind its own flag in the migrations store, and only set the flag once a post-check confirms success — otherwise a partial first run permanently skips the rest. Slug-dependent migrations can leave entries unresolved without throwing.
- Backfill should fill ONLY empty sections (never clobber user edits), and must `update` (draft) THEN `publish` so both draft (admin view) and published (website) carry content. `publish()` also publishes any other pending draft changes on that entry.
- Services have NO top-level slug column — slug lives in the `general` component.
