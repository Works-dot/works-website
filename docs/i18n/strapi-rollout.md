# Strapi Bilingual Rollout Plan — Works. HU + EN

**Goal:** Launch an English version of the Works. website alongside the existing Hungarian site.  
**Current state:** Native Strapi v5 i18n is enabled in code for development and production. The development PostgreSQL copy has `hu` as default and an empty `en` locale. Before Strapi next boots in production, production must receive the fully localized development database.
**English site availability:** The English site MUST remain unavailable until all content is translated and reviewed. Today it is blocked by HU-only router/prerender allow-lists. When EN routes are registered, `englishSiteEnabled` becomes the final editor-controlled publication gate.  
**Constraint:** Do not run the development preparation against the production database or boot production with a database that has not already been localized. Strapi v5 already bundles `@strapi/i18n`; the obsolete v4 package `@strapi/plugin-i18n` must not be installed.

---

## Table of Contents

1. [Architecture Decision — How to Store EN Content](#1-architecture-decision)
2. [Pre-requisites & Safety Checklist](#2-pre-requisites--safety-checklist)
3. [Schema Changes (exact steps)](#3-schema-changes)
4. [Production Content Sync & Backup Order](#4-production-content-sync--backup-order)
5. [AI Translation Import / Review Workflow](#5-ai-translation-import--review-workflow)
6. [Rollout Steps After Production Content Sync](#6-rollout-steps-after-production-content-sync)
7. [Publishing Gate Design](#7-publishing-gate-design)
8. [Acceptance Checklist](#8-acceptance-checklist)

---

## 1. Architecture Decision

### Option A — Strapi i18n Plugin (recommended long-term)
Enable Strapi v5's bundled `@strapi/i18n`. The content-type `pluginOptions.i18n.localized: true` flag enables locale variants (`hu` + `en`) under the same `documentId`; annotate individual translated/review fields, translated component leaves, and their content-bearing component/dynamic-zone containers with `pluginOptions.i18n.localized: true`.

**Pros:** Clean separation, native locale filter API, future-proof.  
**Cons:** Requires schema migration, all existing records must be re-seeded or migrated to `hu` locale. **Not zero-downtime.**

### Option B — Parallel `_en` fields on each content type (quick but messy)
Add `titleEn`, `descriptionEn`, etc. fields alongside existing HU fields. EN content served from same record.

**Pros:** No plugin, no migration.  
**Cons:** Doubles the field count, Strapi admin UI becomes unmanageable, no clean API filter for "give me all EN content".

### Option C — Separate Strapi environment / second database
Duplicate the entire Strapi project for EN with its own database.

**Pros:** Complete isolation.  
**Cons:** Double the maintenance burden, sync hell, not scalable.

### Decision: Option A (native Strapi v5 i18n) — enabled in every environment

Option A is the correct long-term choice. However, because:
- EN content does not exist yet,
- A full professional translation pass is needed first,
- The production site must not break during migration,

**native i18n is enabled in code for every environment.** Production must be populated from the fully localized development database before its next Strapi boot, after its own backup, maintenance window and acceptance pass.

Until then, translation work happens in external documents (spreadsheet or translation memory). The additive, default-off `englishSiteEnabled` field remains the publication gate. No EN content was created by the development migration.

---

## 2. Pre-requisites & Safety Checklist

Complete ALL items before touching any schema or installing any plugin:

### 2.1 Backups (mandatory, in this order)

- [ ] **B1 — Full PostgreSQL dump:**  
  ```bash
  pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S)_pre_i18n.dump
  ```
  Store in a location outside the server (S3, local drive, etc.).

- [ ] **B2 — Strapi media library backup:**  
  Backup `artifacts/strapi/public/uploads/` or the S3 bucket if using cloud storage.

- [ ] **B3 — Git commit of current schema:**  
  ```bash
  git add artifacts/strapi/src/
  git commit -m "chore: snapshot schema before i18n migration"
  git tag pre-i18n-snapshot
  ```

- [ ] **B4 — Export all content via Strapi admin:**  
  Go to Content Manager → each content type → Export (if available) or use the Strapi CLI `strapi export` command:
  ```bash
  cd artifacts/strapi
  npx strapi export --no-encrypt -f content_backup_$(date +%Y%m%d).tar.gz
  ```

### 2.2 Environment readiness

- [ ] Staging environment exists and mirrors production (same PostgreSQL version, same Strapi version).
- [ ] The fully localized development database is restored to **staging** and verified before it is restored to production.
- [ ] All editors have been notified of the maintenance window (editing locked during migration).
- [ ] Node.js version is addressed by the separate runtime-maintenance task before production rollout.

### 2.3 Content readiness

- [ ] All EN translations are complete and reviewed (see §5).
- [ ] Legal texts (consent checkboxes, privacy policy, imprint) reviewed by legal counsel.
- [ ] EN PDFs for `legal-document` (`privacyPdf`, `cookiePdf`, `imprintPdf`) are uploaded and approved.
- [ ] All `REVIEW`-classified fields from `translation-inventory.md` have a human decision documented.

---

## 3. Schema Changes

### 3.1 Verify the existing `englishSiteEnabled` field on `global-setting`

**File:** `artifacts/strapi/src/api/global-setting/content-types/global-setting/schema.ts`

The following field has already been added inside `"attributes"`:

```typescript
"englishSiteEnabled": {
  "type": "boolean",
  "default": false,
  "required": false
}
```

This is the ONLY schema change made before i18n plugin installation. It is safe because:
- It is additive (new column, default false).
- No existing data is affected.
- The frontend can start reading it even before EN content exists.

Before beginning the later i18n rollout:
1. Restart Strapi.
2. In the Strapi admin → Global Settings → confirm `englishSiteEnabled` appears and explicitly set it to `false` (older records may initially expose `null`, which the frontend also treats as disabled).
3. Publish the Global Settings record so the API reflects the change.

### 3.2 Configure native Strapi v5 i18n

> Development preparation is complete. Do not repeat it against production: production receives the fully localized development database before its next Strapi boot.

**Step 1:** Do not add a package. Strapi v5 includes `@strapi/i18n` as an internal plugin.

**Step 2:** Enable the bundled plugin in every environment in `artifacts/strapi/config/plugins.ts`:
```typescript
export default ({ env }) => ({
  i18n: {
    enabled: true,
  },
});
```

Each localized content-type schema declares `pluginOptions.i18n.localized: true` unconditionally. This is safe only because production receives the already-localized development database before Strapi boots.

The development command runs `scripts/prepare-development-i18n.mjs` before Strapi. The script:

1. refuses every environment except explicit `NODE_ENV=development`;
2. requires `PRODUCTION_DATABASE_URL` and refuses any database with the same normalized host, port and database name before opening a connection;
3. converts the untouched initial `en` locale to `hu` only while all visitor-content locale columns are still empty;
4. stores `hu` as Strapi's default;
5. creates the empty `en` locale idempotently.

This ordering is required because Strapi assigns existing records to the current default locale during schema migration. Setting the default after the first localized boot would incorrectly label Hungarian content as English.

**Step 3:** Add locale support to each scoped content type with the Strapi v5 shape `pluginOptions: { i18n: { localized: true } }`:

- `homepage`
- `about-page`
- `career-page`
- `contact-page`
- `projects-page`
- `blog-page`
- `global-setting`
- `legal-document`
- `blog-post`
- `project`
- `service`
- `career-position`
- `team-member`
- `tag`

`client` stays non-localized because every field is language-neutral. The content-type flag enables locale variants, while field annotations control translated values: every direct **TRANSLATE**/**REVIEW** field and every component/dynamic-zone container carrying translated content is localized, and translated component leaf schemas are localized as well. **SHARED** fields remain unannotated and are copied/synchronized by Strapi. UID fields and relations are inherently localized/locale-aware. Media is shared unless explicitly localized; the three `legal-document` PDF media fields are explicitly localized.

**Step 4:** Run Strapi in development to apply schema migrations:
```bash
cd artifacts/strapi
pnpm dev
```
Strapi will assign `hu` to existing records when it detects the localized schemas. The locale column already exists in Strapi v5 tables; the migration is the data assignment and localized document behavior.

**Step 5:** Verify the admin UI shows locale selector on each enabled content type.

**Step 6:** Confirm every existing visitor record has locale `hu`, `en` has no visitor records, and locale-less public requests resolve identically to `?locale=hu`.

### 3.3 Legal document EN PDF strategy

`legal-document` uses native localization. Its `privacyPdf`, `cookiePdf`, and `imprintPdf` fields are explicitly localized media fields. The HU singleton retains its current media relations, while a future EN singleton will reference separately reviewed English privacy, cookie, and imprint PDFs in those fields. Other media fields remain shared unless explicitly localized.

### 3.4 Verified development migration (2026-08-28)

- A custom-format PostgreSQL dump was created before migration.
- The active database URL was verified not to equal the production database URL.
- All existing rows across the 14 localized content types were assigned to `hu`; no locale remained `NULL`.
- Row counts and full row checksums excluding only the `locale` column were identical before and after migration.
- The default locale is `hu`; both `hu` and `en` are available.
- HU public endpoints returned HTTP 200 after restart, including `blog-page` and `projects-page`.
- A temporary EN tag localization was created through Strapi's document service, EN name/slug were edited, HU name/slug remained unchanged, and EN was deleted; no EN content remains.
- No production workflow, database, or website was changed.

---

## 4. Production Content Sync & Backup Order

Execute in this exact order to ensure rollback is possible at every step:

```
STEP 0: Announce maintenance window (minimum 2 hours)
         - Notify all editors — no content changes during migration

STEP 1: B1 — PostgreSQL full dump (see §2.1)
STEP 2: B2 — Media library backup
STEP 3: B3 — Git tag (pre-i18n-snapshot)
STEP 4: B4 — Strapi export

STEP 5: Complete localization and review in DEVELOPMENT
        a. Verify all HU content and schema localization
        b. Run the full EN content import (see §5)
        c. QA both HU and EN API responses
        d. Load test dual-locale queries

STEP 6: IF development passes: restore/copy the fully localized development
        database to STAGING, then boot Staging Strapi and repeat verification

STEP 7: IF staging passes: restore/copy the fully localized development
        database to PRODUCTION before its next Strapi boot

STEP 8: Boot production and verify HU content unchanged via public API spot checks

STEP 9: Set englishSiteEnabled = false in PRODUCTION Global Settings
        (confirm it is still false — do not publish EN until §8 acceptance checklist passes)

STEP 10: End maintenance window
```

### Rollback procedure

If anything breaks after STEP 7:
```bash
# Stop Strapi
# Restore PostgreSQL from STEP 1 dump:
pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS_pre_i18n.dump
# Revert schema files to pre-i18n-snapshot git tag:
git checkout pre-i18n-snapshot -- artifacts/strapi/src/
# Revert the localized schema/config commit only together with the pre-i18n database
# Restart Strapi
```

---

## 5. AI Translation Import / Review Workflow

### 5.1 Export HU content for translation

Use the Strapi REST API to export all translatable content programmatically, or export manually from the admin. Produce a structured JSON or CSV file with:

```
content_type | document_id | field_path | hu_value | en_value (blank)
```

Example columns:
```
blog-post | abc123 | title | "Hogyan tervezzünk..." | ""
blog-post | abc123 | excerpt | "Ebben a cikkben..." | ""
blog-post | abc123 | seo.metaTitle | "UX Tervezés..." | ""
```

Only export fields classified as `TRANSLATE` from `translation-inventory.md`.

### 5.2 AI translation pass

Run the HU content through a translation pipeline:

1. **Preferred tool:** DeepL API (highest quality for HU→EN).  
   Alternative: OpenAI GPT-4o with system prompt: `"You are a professional translator. Translate the following Hungarian marketing and UX copy to natural, professional British English. Preserve HTML/markdown formatting. Do not translate proper nouns (client names, brand names). Return only the translated text."`

2. **Batch by content type** to maintain context.

3. **Richtext fields:** Pass the raw blocks JSON / markdown — do not strip formatting before translating.

4. **REVIEW-classified fields:** Flag these for human decision; do not auto-translate.

5. Output a completed CSV/JSON with `en_value` filled in.

### 5.3 Human review pass (mandatory before import)

Before importing EN content into Strapi, a human reviewer must:

- [ ] Read through all EN translations for naturalness and accuracy.
- [ ] Check all `REVIEW` fields and document decisions (e.g. EN phone format, EN route URLs).
- [ ] Have a legal reviewer approve the EN versions of:
  - `contact.career-consent.checkbox1Text`
  - `contact.career-consent.checkbox2Text`
  - `legal-document` EN PDFs
- [ ] Verify SEO titles and descriptions are within character limits (title ≤60, description ≤160).
- [ ] Confirm EN slugs for projects, blog posts, services, and career positions.
- [ ] Check that EN CTA links point to existing EN routes.

### 5.4 Import EN content into Strapi

**Method A — Strapi Admin (manual, small content volumes):**
1. Open each content type in the admin.
2. Select the `en` locale.
3. Fill in all `TRANSLATE` fields with the reviewed EN values.
4. Save as draft (do NOT publish yet).

**Method B — API import script (recommended for bulk):**

Write a Node.js script using the Strapi REST API:
```typescript
// For each item in the EN translations JSON:
// POST /api/{content-type}/{id}/localizations
// body: { locale: "en", ...enFields }
```

Requires a Strapi API token with full-access write permissions.  
The script should:
1. Load the EN translations JSON.
2. For each record, find the HU document by `documentId`.
3. POST the EN locale variant.
4. Log successes and failures.
5. Do NOT publish — leave all EN records in Draft state.

### 5.5 Slug management for EN

All EN slugs must be confirmed before import. Naming convention:

| HU slug | EN slug |
|---|---|
| `ux-tervezes` | `ux-design` |
| `hogyan-tervezzunk-hatekony-mobilalkalmazast` | `how-to-design-an-effective-mobile-app` |
| `digitalis-termektervezes` | `digital-product-design` |

Store the slug mapping in a spreadsheet and include in the import JSON.

---

## 6. Rollout Steps After Production Content Sync

These steps happen AFTER the schema migration (§3) and EN content import (§5) are complete on production, and AFTER the acceptance checklist (§8) passes on staging.

```
ROLLOUT STEP 1: Deploy frontend code that supports EN routing
                - Routes use the reserved EN map (/en/projects, /en/services, etc.)
                - Language switcher component
                - Locale detection logic
                - Frontend reads globalSetting.englishSiteEnabled
                - If false: /en/* returns 404 or redirects to HU site
                (Do this BEFORE flipping the boolean — EN routes exist but are gated)

ROLLOUT STEP 2: Verify all EN API endpoints return correct data
                GET /api/homepage?locale=en → EN homepage data
                GET /api/projects?locale=en → EN project list
                etc.

ROLLOUT STEP 3: Full QA of EN site on production (with englishSiteEnabled=false)
                - Access EN routes directly with internal bypass (e.g. ?preview=en)
                - Check all pages render correctly
                - Check all links point to EN routes
                - Check SEO tags are EN
                - Check legal consent texts are EN
                - Check legal PDF links work

ROLLOUT STEP 4: Publish all EN Strapi records
                In the Strapi admin, bulk-publish all EN locale drafts:
                - All single types (homepage, about-page, career-page, contact-page,
                  global-setting, legal-document) — EN locale
                - All blog-post EN records
                - All project EN records
                - All service EN records
                - All career-position EN records
                - All team-member EN records (if title was translated)
                - All tag EN records

ROLLOUT STEP 5: Flip the gate
                In Strapi admin → Global Settings → EN locale:
                Set englishSiteEnabled = true
                Publish the record.
                
                The English site is now live.

ROLLOUT STEP 6: Monitor
                - Check analytics for EN traffic
                - Check error logs for broken EN routes
                - Check search console for EN URL indexing (set hreflang if needed)
```

---

## 7. Publishing Gate Design

### 7.1 The `englishSiteEnabled` boolean

**Location:** `global-setting` content type, field `englishSiteEnabled`  
**Default value:** `false`  
**Type:** boolean  
**Who controls it:** Content editors via the Strapi admin panel  

The field is read by the frontend on **every page load** via the existing `getGlobalSettings()` function in `artifacts/works-website/src/lib/strapi.ts`.

### 7.2 Frontend gate logic (to be implemented in a future task)

The frontend must implement the following logic:

```typescript
// In the root layout / middleware:
const settings = await getGlobalSettings();

// For any /en/* route:
if (isEnglishRoute(currentPath) && !settings.englishSiteEnabled) {
  // Option A: Return 404
  return notFound();
  // Option B: Redirect to Hungarian equivalent
  // return redirect(getHuEquivalent(currentPath));
}
```

**Recommended:** Return 404 (not redirect) to avoid leaking the EN URL structure prematurely.

### 7.3 Cache-busting the gate

`getGlobalSettings()` should NOT be cached when checking `englishSiteEnabled` — or the cache TTL must be very short (≤60 seconds). This ensures that when the boolean is flipped, the change propagates quickly without a full deployment.

### 7.4 Secondary gate — draft status

Even with `englishSiteEnabled = true`, the frontend only serves **published** EN records (Strapi default). Draft EN records are only visible with `?status=draft` (which requires a preview token). This provides an additional safety layer.

### 7.5 Gate state table

| `englishSiteEnabled` | EN record published | Visible to public? |
|---|---|---|
| `false` | any | ❌ No — gated by boolean |
| `true` | `draft` | ❌ No — not published |
| `true` | `published` | ✅ Yes |

---

## 8. Acceptance Checklist

Complete this checklist on **staging** before executing ROLLOUT STEP 5 on production.

### 8.1 Content completeness

- [ ] All single types have EN locale records published: `homepage`, `about-page`, `career-page`, `contact-page`, `global-setting`, `legal-document`
- [ ] All `project` records have EN locale variants published (or are HU-only with `SHARED` fields serving both)
- [ ] All `blog-post` records have EN locale variants published
- [ ] All `service` records have EN locale variants published
- [ ] All active `career-position` records have EN locale variants published
- [ ] All `tag` records have EN `name` values
- [ ] All `team-member` records have EN `title` values

### 8.2 SEO

- [ ] All EN `seo.metaTitle` values are ≤60 characters
- [ ] All EN `seo.metaDescription` values are ≤160 characters
- [ ] `hreflang` tags implemented in frontend (`<link rel="alternate" hreflang="hu">` and `<link rel="alternate" hreflang="en">`)
- [ ] EN sitemap generated (if sitemap plugin is used)
- [ ] No HU text appearing on EN pages (check for untranslated fields)

### 8.3 Legal / compliance

- [ ] EN career consent checkbox texts reviewed by legal counsel ✓ _[sign-off required]_
- [ ] EN privacy policy PDF uploaded and linked
- [ ] EN imprint/impresszum PDF uploaded and linked (or decision made that EN users see HU imprint)
- [ ] EN cookie consent text correct (if managed via Strapi)
- [ ] GDPR compliance checked for EN market

### 8.4 Routing & navigation

- [ ] All internal CTA links in EN content point to EN routes (not HU routes)
- [ ] Language switcher correctly maps HU ↔ EN for all route types:
  - `/` ↔ `/en`
  - `/projektek` ↔ `/en/projects`
  - `/projektek/:slug` ↔ `/en/projects/:en-slug`
  - `/blog` ↔ `/en/blog`
  - `/blog/:slug` ↔ `/en/blog/:en-slug`
  - `/szolgaltatasok/:slug` ↔ `/en/services/:en-slug`
  - `/rolunk` ↔ `/en/about`
  - `/kapcsolat` ↔ `/en/contact`
  - `/karrier` ↔ `/en/careers`
  - `/karrier/:slug` ↔ `/en/careers/:en-slug`
  - `/adatkezeles` ↔ `/en/privacy`
  - `/sutik` ↔ `/en/cookies`
- [ ] EN routes return 404 when `englishSiteEnabled = false`
- [ ] No broken links on any EN page

### 8.5 Functional testing

- [ ] Contact form works on EN page (labels, subjects, consent checkboxes in English)
- [ ] CV upload works on EN career page
- [ ] Blog post filtering by tag works on EN blog
- [ ] Project filtering by tag works on EN projects page
- [ ] Career position detail pages load correctly in EN
- [ ] Service pages render all sections correctly in EN
- [ ] Map embed displays correctly on EN contact page
- [ ] Opening hours show English day names

### 8.6 Performance

- [ ] EN pages load within acceptable time (≤3s LCP on mobile)
- [ ] No duplicate database queries due to locale handling
- [ ] Image optimization unchanged (SHARED images serve both locales efficiently)

### 8.7 Analytics & monitoring

- [ ] Analytics tracking set up for EN traffic (separate view or language dimension)
- [ ] Error monitoring watching for EN-specific 404s or API errors
- [ ] Uptime monitoring verified still works after gate flip

---

## Appendix A — Field scope

The authoritative field-by-field scope is
[`translation-inventory.md`](./translation-inventory.md). Counts are not
duplicated here because reusable component fields appear in several content
types, which makes a second per-type summary ambiguous and prone to drift.

The implementation follows the inventory classifications directly:

- `TRANSLATE` and `REVIEW` attributes are localized;
- `LOCALE_RELATION` and UID attributes use Strapi's locale-aware semantics;
- `SHARED` attributes remain unlocalized;
- the three `legal-document` PDF media attributes are explicitly localized.

---

## Appendix B — Hardcoded strings in frontend code

The following strings are hardcoded in `artifacts/works-website/src/lib/strapi.ts` and are NOT managed via Strapi. They must be made locale-aware when EN is activated:

| Constant | Current HU value | Required EN value |
|---|---|---|
| `CAREER_LOCATION` | `"Budapest / Hybrid"` | `"Budapest / Hybrid"` (same) |
| `CAREER_TYPE` | `"Teljes munkaidő"` | `"Full-time"` |

These are used in `getCareerPositions()` and `getCareerPositionBySlug()`. When EN is activated, the function should accept a `locale` parameter and return the appropriate string.

---

*Last updated: 2026-08-28. Development migration verified; production must receive the fully localized development database before Strapi boots, and rollout remains gated by §2.*
