# CMS legal HTML — implementation and release handoff

## Scope and publication state

The Hungarian privacy, cookie and imprint pages now render the published
`legal-document` CMS rich text as prerendered HTML. The existing PDF relations
remain optional downloads. No production database write, deployment or GitHub
write was performed.

English translations are **not published**. The approved interim policy is:

- English legal navigation and consent links lead to the Hungarian HTML and
  visibly include `(Hungarian)`.
- `/en/privacy`, `/en/cookies` and `/en/imprint` return temporary 302 redirects,
  preserve queries/trailing slashes for GET/HEAD, and send `noindex`/`no-store`.
- There are no English legal pages in the generated sitemap or prerender list,
  and no English legal canonical/hreflang claims.
- `/imprint` and `/terms` now directly 301 to
  `https://www.worksdot.hu/impresszum`; the other 27 legacy mappings are unchanged.

The complete paired HU/EN review is a standalone, network-independent HTML file
at `.local/legal-review/english-approval.html`. It is gitignored and outside
every public directory. Do not add it, its translations, or private backups to
the public repository. Approval and a later English publication change are
still required.

## Source fidelity

The three checked-in PDF sources supplied the Hungarian content in
`artifacts/strapi/src/seed-documents/legal-hu.json`.

SHA-256:

- Privacy: `a420ed05a47bb8d669d211beed7e835b11061f4bdd93845cd3051e4bb5bde109`
- Imprint: `5f150d5b127b31416e3f4945f5e90187018a82ff18209a01bce5f758821d122e`
- Cookies: `a99b56a97f7ffa83b815172e847b13d63a7579c082910cea2c411a062bb92d1c`

The existing development CMS privacy and imprint downloads matched the source
PDF hashes byte-for-byte. The cookie PDF relation was already empty; it remains
empty rather than silently attaching/replacing media. The cookie source is the
existing four-page seed PDF.

All 16 pages were extracted and rendered to private PNGs. Visual checks covered
the imprint/company and bank tables, privacy cover dates/version metadata,
privacy page 8 and the cookie identifier/expiry table. Every page received a
text comparison and translation fidelity review. A document-wide token-count
comparison confirmed no missing Hungarian words: only privacy pagination
numbers were omitted; its two generic table column headings add “Tétel” and
“Leírás”. Cookie and imprint word counts match their PDF sources exactly.
Markdown code quoting preserves `_ga_<azonosító>` visibly rather than treating
its suffix as HTML.

Source inconsistencies were not legally rewritten: the privacy cover says
v1.2 while its footer says v1.1 / working material for legal review; the original
section-5/recipients concatenation is retained in the table of contents. The
source references Cookiebot/analytics; this task does not revise those legal
claims or the cookie implementation.

## CMS and data safety

Six localized fields were added to the existing single type:
`privacyTitle`, `privacyBody`, `cookieTitle`, `cookieBody`, `imprintTitle`,
`imprintBody`. Existing draft/publish and media fields remain.

The public controller forces `status=published`, including requests containing
`status=draft`, and limits population to the three media fields to prevent
localization traversal. The frontend legal fetch also explicitly requests
published data. No legal admin-preview route exposes a draft. EN draft texts
are not stored in CMS by this implementation; they are private work files.

`initialize-legal-hu.mjs` is deliberately development-only and reuses the
existing production-database identity guard. It creates private backups,
fills only empty HU draft fields, stops draft/published conflicts, never
touches media/other locales, and rechecks state before writing. By default it
does not publish. Explicit `--apply --publish` is permitted only when the six
planned values match the approved source exactly and no unpublished PDF
relation differs from the published record. Existing admin edits require
manual review/publication instead. Legacy PDF bootstrap is prevented from
accidentally publishing a legal HTML draft.

Development initialization/publication was performed with a private backup in
`artifacts/strapi/.tmp/legal-backups/`; a repeat `--apply` produced zero fields.
The integration test temporarily edited HU/EN draft titles, proved they were
excluded from public responses even under `status=draft`, proved the initializer
preserved the HU editor change, and restored both test edits. Standalone tools
wait for Strapi's asynchronous post-commit queries before closing the DB.

## Verification

- Website and Strapi TypeScript checks passed.
- Client + SSR + prerender build passed: 122 generated pages.
- Published CMS snapshot matches all six authoritative HU fields.
- Full rendered Markdown output is checked against every legal page's HTML,
  including one H1, correct canonical, no EN alternates and safe URL/HTML handling.
- All 19 legal source/planner, redirect and server regressions pass.
- Built legacy manifest validates all 29 HTML destinations.
- Locale validation passes all 78 checks.
- Real development HU/EN drafts were excluded from the public API; restoration
  and idempotent rerun passed.
- Private review is ignored; 13 long translated passages were checked absent
  from all generated JS/HTML/XML assets, and EN snapshot bodies are empty.
- Existing-preview mobile screenshot at 390 × 844 showed readable cookie HTML.
  No browser-testing subagent was used.
- Existing privacy and imprint PDF URLs returned HTTP200.

The parent restarted both Strapi and Website workflows after implementation;
both started successfully, and a desktop screenshot confirmed rendered imprint
content. One integration attempt encountered a
temporarily unavailable local CMS, then a standalone post-commit shutdown race;
both were addressed/retested successfully. No production smoke test or manual
admin-UI interaction was performed.

## Release order (operator/parent responsibility)

1. Back up production CMS/database/media and inspect existing legal draft and
   published values. Do not run the general seed.
2. Release the **Strapi schema/controller/admin changes first**. The new fields
   require database storage/schema synchronization; a separate Postgres service
   restart or replacement is not part of this change.
3. An authorized operator populates only empty HU fields from the reviewed JSON
   through CMS admin, applying the same conflict/non-overwrite rules. Preserve
   media relations and other locales. Review existing drafts before publishing.
   The included development helper intentionally refuses production and is not
   a production command to copy blindly.
4. Publish HU and verify the public API returns all six complete fields, while
   `status=draft` still cannot reveal drafts.
5. Only then rebuild/deploy the Website from a fresh, strict CMS fetch.
   Prerender intentionally fails if any required HU field is empty.
6. Verify legal HTML200, PDF attachments, consent/settings links, all legacy
   redirects, English temporary redirects, canonical/hreflang and sitemap.
7. Keep English translation publication withheld until separate user approval.

## Explicit source-file push allowlist

Only these implementation files are intended for the parent's scoped push:

```text
artifacts/strapi/src/api/legal-document/content-types/legal-document/schema.ts
artifacts/strapi/src/api/legal-document/controllers/legal-document.ts
artifacts/strapi/src/index.ts
artifacts/strapi/types/generated/contentTypes.d.ts
artifacts/strapi/src/seed-documents/legal-hu.json
artifacts/strapi/scripts/initialize-legal-hu.mjs
artifacts/strapi/scripts/legal-content-plan.mjs
artifacts/strapi/scripts/legal-content-plan.test.mjs
artifacts/strapi/scripts/test-legal-publication.mjs
artifacts/works-website/legal-redirects.mjs
artifacts/works-website/legacy-redirects.mjs
artifacts/works-website/server.mjs
artifacts/works-website/vite.config.ts
artifacts/works-website/scripts/fetch-strapi-data.mjs
artifacts/works-website/scripts/prerender.mjs
artifacts/works-website/scripts/server.test.mjs
artifacts/works-website/scripts/test-legacy-redirect-build.mjs
artifacts/works-website/scripts/validate-locale.mjs
artifacts/works-website/scripts/legal-html.test.mjs
artifacts/works-website/scripts/test-legal-build.mjs
artifacts/works-website/src/App.tsx
artifacts/works-website/src/components/CookieBanner.tsx
artifacts/works-website/src/components/layout/Footer.tsx
artifacts/works-website/src/data/fallback.ts
artifacts/works-website/src/data/strapi-cache.json
artifacts/works-website/src/lib/i18n-routes.ts
artifacts/works-website/src/lib/strapi.ts
artifacts/works-website/src/pages/Adatkezeles.tsx
artifacts/works-website/src/pages/Sutik.tsx
artifacts/works-website/src/pages/Impresszum.tsx
artifacts/works-website/src/pages/LegalPage.tsx
artifacts/works-website/src/pages/Contact.tsx
artifacts/works-website/src/routes.types.ts
artifacts/works-website/src/routes.lazy.tsx
artifacts/works-website/src/routes.static.tsx
artifacts/works-website/src/seo-data.ts
docs/legal-html-report.md
```

Exclude `.local/`, `.agents/`, private backups, build output, `.replit`,
`.strapi-updater.json` and unrelated parent changes. Python/PyMuPDF were used
only for local extraction/review; they are not website runtime dependencies.