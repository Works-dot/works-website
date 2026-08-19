# Strapi Translation Inventory — Works. Bilingual Preparation

**Scope:** Hungarian (HU) → English (EN) translation classification for every Strapi schema field.  
**Strategy:** Strapi i18n is the recommended long-term storage model, but it stays disabled until the production content is synchronized, backed up and the migration is validated in staging. The exact rollout is defined in `strapi-rollout.md`. This document classifies fields only.
**Status:** The translation inventory is documentation. The only preparatory schema change is the additive, default-off `englishSiteEnabled` publication gate on Global Settings; no content type is localized yet.

---

## Classification Legend

| Code | Meaning |
|---|---|
| **TRANSLATE** | Field contains human-readable copy that must be translated into English. Deliver as an EN duplicate field or separate EN entry. |
| **SHARED** | Field is language-neutral (URL, number, boolean, date, media asset, enum code). Single value serves both locales. |
| **LOCALE_RELATION** | A relation that points to records which themselves need locale variants (e.g. tags whose `name` is visible UI text). |
| **REVIEW** | Field may need locale-specific value but is ambiguous; a human must decide (e.g. a phone number, address, or URL that differs per market). |

---

## 1. Single Types

### 1.1 `homepage` (Főoldal)

Field path uses component notation: `component.field`.

| Field | Type | Classification | Notes |
|---|---|---|---|
| `hero` | component | — | container |
| `hero.heading` | string | **TRANSLATE** | Main headline |
| `hero.highlightedWord` | string | **TRANSLATE** | The animated highlighted word inside heading |
| `hero.description` | text | **TRANSLATE** | Subheading paragraph |
| `hero.primaryCtaText` | string | **TRANSLATE** | Primary CTA button label |
| `hero.primaryCtaLink` | string | **REVIEW** | Likely `/projektek` → `/en/projects`; URL depends on EN route map |
| `hero.secondaryCtaText` | string | **TRANSLATE** | Secondary CTA button label |
| `hero.secondaryCtaLink` | string | **REVIEW** | Same routing consideration |
| `hero.backgroundImage` | media | **SHARED** | Visual asset, no text |
| `servicesSection` | component | — | container |
| `servicesSection.heading` | string | **TRANSLATE** | Section title |
| `projectsSection` | component | — | container |
| `projectsSection.heading` | string | **TRANSLATE** | Section title |
| `ctaBanner` | component | — | container |
| `ctaBanner.heading` | string | **TRANSLATE** | Banner headline |
| `ctaBanner.ctaText` | string | **TRANSLATE** | Button label |
| `ctaBanner.ctaLink` | string | **REVIEW** | Internal route, may need `/en/` prefix |
| `blogSection` | component | — | container |
| `blogSection.heading` | string | **TRANSLATE** | Section title |
| `seo` | component | — | container |
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | May reuse HU image unless EN-specific variant needed |

---

### 1.2 `about-page` (Rólunk oldal)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `hero.heading` | string | **TRANSLATE** | |
| `hero.description` | text | **TRANSLATE** | |
| `hero.backgroundImage` | media | **SHARED** | |
| `intro.heading` | string | **TRANSLATE** | About section headline |
| `intro.body` | richtext | **TRANSLATE** | Company description rich text |
| `galleryImages` | media (multiple) | **SHARED** | Photo gallery, no text |

---

### 1.3 `career-page` (Karrier oldal)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `hero.heading` | string | **TRANSLATE** | |
| `hero.description` | text | **TRANSLATE** | |
| `hero.backgroundImage` | media | **SHARED** | |
| `workWithUs.heading` | string | **TRANSLATE** | |
| `workWithUs.description` | text | **TRANSLATE** | |
| `whyUs.sectionHeading` | string | **TRANSLATE** | |
| `whyUs.items[].title` | string | **TRANSLATE** | Each card title |
| `whyUs.items[].description` | text | **TRANSLATE** | Each card body |
| `whyUs.items[].image` | media | **SHARED** | |

---

### 1.4 `contact-page` (Kapcsolat oldal)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `hero.heading` | string | **TRANSLATE** | |
| `hero.description` | text | **TRANSLATE** | |
| `hero.backgroundImage` | media | **SHARED** | |
| `formHeading` | string | **TRANSLATE** | Form section title |
| `formSubjects[].label` | string | **TRANSLATE** | Visible dropdown option text |
| `formSubjects[].value` | string | **REVIEW** | Machine value used in e-mail subject; may stay HU or be changed per locale |
| `formSubjects[].isCareer` | boolean | **SHARED** | Logic flag |
| `careerConsent.checkbox1Text` | text | **TRANSLATE** | Legal consent checkbox label (visible to users) |
| `careerConsent.checkbox2Text` | text | **TRANSLATE** | Legal consent checkbox label (visible to users) |
| `successTitle` | string | **TRANSLATE** | |
| `successMessage` | text | **TRANSLATE** | |
| `mapHeading` | string | **TRANSLATE** | |
| `mapEmbedUrl` | text | **SHARED** | Google Maps embed URL; same map for both locales |
| `backgroundImage` | media | **SHARED** | |

---

### 1.5 `global-setting` (Globális beállítások)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `siteName` | string | **REVIEW** | Probably "Works." in both locales but verify |
| `logo` | media | **SHARED** | |
| `favicon` | media | **SHARED** | |
| `ogImage` | media | **SHARED** | May want EN-specific OG image |
| `socialLinks[].platform` | string | **SHARED** | Platform identifier |
| `socialLinks[].url` | string | **SHARED** | Same social URLs |
| `contactEmail` | email | **SHARED** | Same address |
| `contactPhone` | string | **REVIEW** | May display with country code for EN users |
| `address` | text | **REVIEW** | Could be formatted differently (e.g. country line) for EN |
| `openingHours[].day` | string | **TRANSLATE** | "Hétfő" → "Monday" |
| `openingHours[].hours` | string | **SHARED** | Time values are locale-neutral |
| `footerTagline` | text | **TRANSLATE** | |
| `newsletterHeading` | string | **TRANSLATE** | |
| `newsletterDescription` | text | **TRANSLATE** | |
| `copyrightText` | string | **TRANSLATE** | Year + company name string |
| `legalLinks[].label` | string | **TRANSLATE** | "Adatkezelés" → "Privacy Policy" |
| `legalLinks[].url` | string | **REVIEW** | `/adatkezeles` → `/en/privacy` (reserved EN route) |
| `heroBackgroundPattern` | media | **SHARED** | |
| `bgGraphic1` | media | **SHARED** | |
| `bgGraphic2` | media | **SHARED** | |
| **`englishSiteEnabled`** | boolean | **SHARED** | Additive publishing gate already present; only literal `true` enables EN. See §4 below. |

---

### 1.6 `legal-document` (Jogi dokumentumok)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `privacyPdf` | media (file) | **TRANSLATE** | A separate EN PDF must be uploaded; the EN locale should reference an English-language PDF |
| `imprintPdf` | media (file) | **TRANSLATE** | Same: separate EN PDF required |

> **Note:** Because `legal-document` is a single type with no locale variants in the current schema, EN PDFs need either (a) two additional media fields (`privacyPdfEn`, `imprintPdfEn`) added to the schema, or (b) the record duplicated with a locale discriminator once i18n is installed. Decision deferred to rollout step — see `strapi-rollout.md §3.3`.

---

## 2. Collection Types

### 2.1 `project` (Projektek)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `slug` | uid | **REVIEW** | EN slug may differ (e.g. hungarian word replaced). Generate new EN uid from EN title. |
| `title` | string | **TRANSLATE** | |
| `description` | text | **TRANSLATE** | Card description |
| `image` | media | **SHARED** | Hero/card image |
| `homepageImage` | media | **SHARED** | Homepage featured image |
| `featured` | boolean | **SHARED** | Same featured flag for both locales |
| `order` | integer | **SHARED** | Sort order applies to both |
| `tags` | relation (manyToMany → `tag`) | **LOCALE_RELATION** | Tags have a `name` field visible in UI — tags need EN variants; see §2.6 |
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `caseStudy.heroSubtitle` | text | **TRANSLATE** | |
| `caseStudy.client` | string | **SHARED** | Client name — proper noun, do not translate |
| `caseStudy.year` | string | **SHARED** | |
| `caseStudy.duration` | string | **TRANSLATE** | "6 hónap" → "6 months" |
| `contentBlocks[text-block].body` | richtext | **TRANSLATE** | |
| `contentBlocks[image-block].image` | media | **SHARED** | |
| `contentBlocks[image-block].caption` | string | **TRANSLATE** | |
| `contentBlocks[highlight-block].quote` | richtext | **TRANSLATE** | |
| `services` | relation (via `service.relatedProjects`) | **LOCALE_RELATION** | Cross-reference maintained on service side |

---

### 2.2 `blog-post` (Blog bejegyzések)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `slug` | uid | **REVIEW** | Generate EN slug from EN title |
| `title` | string | **TRANSLATE** | |
| `excerpt` | text | **TRANSLATE** | |
| `date` | date | **SHARED** | |
| `author` | relation (manyToOne → `team-member`) | **SHARED** | Author is the same person regardless of language |
| `image` | media | **SHARED** | |
| `tags` | relation (manyToMany → `tag`) | **LOCALE_RELATION** | Tag names need EN variants |
| `readingTime` | string | **TRANSLATE** | "5 perc olvasás" → "5 min read" |
| `featured` | boolean | **SHARED** | |
| `order` | integer | **SHARED** | |
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `contentBlocks[text-block].body` | richtext | **TRANSLATE** | |
| `contentBlocks[image-block].image` | media | **SHARED** | |
| `contentBlocks[image-block].caption` | string | **TRANSLATE** | |
| `contentBlocks[highlight-block].quote` | richtext | **TRANSLATE** | |

---

### 2.3 `service` (Szolgáltatások)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `title` | string | **TRANSLATE** | Top-level title field (also exists inside `general.title`) |
| `order` | integer | **SHARED** | |
| `general.slug` | string | **REVIEW** | Routing slug; EN version likely needs EN slug ("ux-design" stays, Hungarian names change) |
| `general.title` | string | **TRANSLATE** | |
| `general.subtitle` | string | **TRANSLATE** | |
| `general.heroDescription` | text | **TRANSLATE** | |
| `general.icon` | media | **SHARED** | |
| `general.heroImage` | media | **SHARED** | |
| `definitionSection.kicker` | string | **TRANSLATE** | |
| `definitionSection.heading` | string | **TRANSLATE** | |
| `definitionSection.description` | text | **TRANSLATE** | |
| `questionsSection.intro.kicker` | string | **TRANSLATE** | |
| `questionsSection.intro.heading` | string | **TRANSLATE** | |
| `questionsSection.intro.description` | text | **TRANSLATE** | |
| `questionsSection.cards[].title` | string | **TRANSLATE** | |
| `questionsSection.cards[].description` | text | **TRANSLATE** | |
| `helpSection.intro.*` | string/text | **TRANSLATE** | All three intro fields |
| `helpSection.cards[].title` | string | **TRANSLATE** | |
| `helpSection.cards[].description` | text | **TRANSLATE** | |
| `helpSection.cards[].icon` | media | **SHARED** | |
| `processSection.intro.*` | string/text | **TRANSLATE** | |
| `processSection.steps[].title` | string | **TRANSLATE** | |
| `processSection.steps[].description` | text | **TRANSLATE** | |
| `deliverablesSection.intro.*` | string/text | **TRANSLATE** | |
| `deliverablesSection.variant` | enumeration | **SHARED** | Layout code |
| `deliverablesSection.smallCards[].title` | string | **TRANSLATE** | |
| `deliverablesSection.smallCards[].description` | text | **TRANSLATE** | |
| `deliverablesSection.smallCards[].icon` | media | **SHARED** | |
| `deliverablesSection.largeCards[].title` | string | **TRANSLATE** | |
| `deliverablesSection.largeCards[].description` | text | **TRANSLATE** | |
| `deliverablesSection.largeCards[].icon` | media | **SHARED** | |
| `deliverablesSection.largeCards[].bullets[].text` | string | **TRANSLATE** | |
| `ctaBanner.heading` | string | **TRANSLATE** | |
| `ctaBanner.ctaText` | string | **TRANSLATE** | |
| `ctaBanner.ctaLink` | string | **REVIEW** | Internal route |
| `projectExamplesIntro.*` | string/text | **TRANSLATE** | |
| `faqSection.intro.*` | string/text | **TRANSLATE** | |
| `faqSection.items[].question` | string | **TRANSLATE** | |
| `faqSection.items[].answer` | text | **TRANSLATE** | |
| `relatedServicesIntro.*` | string/text | **TRANSLATE** | |
| `relatedServices` | relation (oneToMany → `service`) | **LOCALE_RELATION** | Points to EN variants of related services |
| `relatedProjects` | relation (manyToMany → `project`) | **LOCALE_RELATION** | Points to EN variants of projects |
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |

---

### 2.4 `career-position` (Karrier pozíciók)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `slug` | uid | **REVIEW** | Generate EN slug from EN title |
| `title` | string | **TRANSLATE** | Job title |
| `team` | string | **TRANSLATE** | Team/department name |
| `tags` | relation (manyToMany → `tag`) | **LOCALE_RELATION** | Tag names need EN variants |
| `excerpt` | text | **TRANSLATE** | Short job description |
| `isActive` | boolean | **SHARED** | Applies to both locales |
| `seo.metaTitle` | string | **TRANSLATE** | |
| `seo.metaDescription` | text | **TRANSLATE** | |
| `seo.ogImage` | media | **SHARED** | |
| `contentBlocks[text-block].body` | richtext | **TRANSLATE** | Full job description |
| `contentBlocks[image-block].image` | media | **SHARED** | |
| `contentBlocks[image-block].caption` | string | **TRANSLATE** | |
| `contentBlocks[highlight-block].quote` | richtext | **TRANSLATE** | |

> **Note:** Hardcoded values in `strapi.ts` — `CAREER_LOCATION = "Budapest / Hybrid"` and `CAREER_TYPE = "Teljes munkaidő"` — are set in application code, not in Strapi. These will need to be made locale-aware in the frontend when English is activated.

---

### 2.5 `client` (Ügyfelek)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `name` | string | **SHARED** | Client/brand name — proper noun |
| `initials` | string | **SHARED** | |
| `logo` | media | **SHARED** | |
| `order` | integer | **SHARED** | |
| `featured` | boolean | **SHARED** | |

> `client` has `draftAndPublish: false` — no publish gate needed.

---

### 2.6 `tag` (Címkék)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `name` | string | **TRANSLATE** | Tag display text shown to users (e.g. "UX Tervezés" → "UX Design") |
| `slug` | uid | **REVIEW** | URL segment; EN slug should be English (e.g. `ux-design`) |
| `projects` | relation | **SHARED** | Reverse relation — maintained by project side |
| `blogPosts` | relation | **SHARED** | Reverse relation |
| `careerPositions` | relation | **SHARED** | Reverse relation |

> `tag` has `draftAndPublish: false` — changes take effect immediately.  
> Tags are used for filtering UI. When i18n is applied, either: (a) add `nameEn` field to the same record, or (b) create separate EN tag records. Strategy (a) is simpler and avoids relinking all relations.

---

### 2.7 `team-member` (Csapattagok)

| Field | Type | Classification | Notes |
|---|---|---|---|
| `name` | string | **SHARED** | Person's name — do not translate |
| `title` | string | **TRANSLATE** | Job title/role (e.g. "Vezető tervező" → "Lead Designer") |
| `image` | media | **SHARED** | |
| `order` | integer | **SHARED** | |

---

## 3. Components (standalone classification)

Components are embedded inside content types. This section lists each component for completeness; field classifications above take precedence.

### 3.1 `shared.seo`
| Field | Classification |
|---|---|
| `metaTitle` | **TRANSLATE** |
| `metaDescription` | **TRANSLATE** |
| `ogImage` | **SHARED** |

### 3.2 `shared.hero`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `backgroundImage` | **SHARED** |

### 3.3 `shared.social-link`
| Field | Classification |
|---|---|
| `platform` | **SHARED** |
| `url` | **SHARED** |

### 3.4 `shared.legal-link`
| Field | Classification |
|---|---|
| `label` | **TRANSLATE** |
| `url` | **REVIEW** (route-dependent) |

### 3.5 `shared.opening-hours`
| Field | Classification |
|---|---|
| `day` | **TRANSLATE** ("Hétfő" → "Monday") |
| `hours` | **SHARED** |

### 3.6 `homepage.hero`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |
| `highlightedWord` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `primaryCtaText` | **TRANSLATE** |
| `primaryCtaLink` | **REVIEW** |
| `secondaryCtaText` | **TRANSLATE** |
| `secondaryCtaLink` | **REVIEW** |
| `backgroundImage` | **SHARED** |

### 3.7 `homepage.cta-banner`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |
| `ctaText` | **TRANSLATE** |
| `ctaLink` | **REVIEW** |

### 3.8 `homepage.blog-section`, `homepage.projects-section`, `homepage.services-section`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |

### 3.9 `about.intro`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |
| `body` | **TRANSLATE** (richtext) |

### 3.10 `career.work-with-us`
| Field | Classification |
|---|---|
| `heading` | **TRANSLATE** |
| `description` | **TRANSLATE** |

### 3.11 `career.why-us-section`
| Field | Classification |
|---|---|
| `sectionHeading` | **TRANSLATE** |
| `items` | — (container) |

### 3.12 `career.why-us-item`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `image` | **SHARED** |

### 3.13 `contact.form-subject`
| Field | Classification |
|---|---|
| `label` | **TRANSLATE** |
| `value` | **REVIEW** |
| `isCareer` | **SHARED** |

### 3.14 `contact.career-consent`
| Field | Classification |
|---|---|
| `checkbox1Text` | **TRANSLATE** (legal text — GDPR consent) |
| `checkbox2Text` | **TRANSLATE** (legal text — GDPR consent) |

> **Legal note:** Consent checkbox copy is legally binding GDPR language. EN translation must be reviewed by legal counsel before publishing.

### 3.15 `content.text-block`
| Field | Classification |
|---|---|
| `body` | **TRANSLATE** (richtext) |

### 3.16 `content.image-block`
| Field | Classification |
|---|---|
| `image` | **SHARED** |
| `caption` | **TRANSLATE** |

### 3.17 `content.highlight-block`
| Field | Classification |
|---|---|
| `quote` | **TRANSLATE** (richtext) |

### 3.18 `project.case-study`
| Field | Classification |
|---|---|
| `heroSubtitle` | **TRANSLATE** |
| `client` | **SHARED** |
| `year` | **SHARED** |
| `duration` | **TRANSLATE** |

### 3.19 `service.general`
| Field | Classification |
|---|---|
| `slug` | **REVIEW** |
| `title` | **TRANSLATE** |
| `subtitle` | **TRANSLATE** |
| `heroDescription` | **TRANSLATE** |
| `icon` | **SHARED** |
| `heroImage` | **SHARED** |

### 3.20 `service.section-intro`
| Field | Classification |
|---|---|
| `kicker` | **TRANSLATE** |
| `heading` | **TRANSLATE** |
| `description` | **TRANSLATE** |

### 3.21 `service.question-card`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |

### 3.22 `service.help-card`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `icon` | **SHARED** |

### 3.23 `service.process-step`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |

### 3.24 `service.deliverable-card`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `icon` | **SHARED** |

### 3.25 `service.deliverable-group`
| Field | Classification |
|---|---|
| `title` | **TRANSLATE** |
| `description` | **TRANSLATE** |
| `icon` | **SHARED** |
| `bullets[].text` | **TRANSLATE** |

### 3.26 `service.bullet-point`
| Field | Classification |
|---|---|
| `text` | **TRANSLATE** |

### 3.27 `service.faq-item`
| Field | Classification |
|---|---|
| `question` | **TRANSLATE** |
| `answer` | **TRANSLATE** |

### 3.28 `service.deliverables-section`
| Field | Classification |
|---|---|
| `intro` | — (contains `service.section-intro`, see §3.20) |
| `variant` | **SHARED** |
| `smallCards` | — |
| `largeCards` | — |

---

## 4. Publishing Gate Field — `global-setting.englishSiteEnabled`

An additive boolean field is present in the `global-setting` schema:

```
Field name:    englishSiteEnabled
Type:          boolean
Default:       false
Required:      false
Description:   "When true, the English version of the site is visible to public users."
```

**Current state:** The field exists in `artifacts/strapi/src/api/global-setting/content-types/global-setting/schema.ts`. It defaults to `false`; existing records may return `null` until resaved, and the frontend deliberately treats every value except literal `true` as disabled. Strapi i18n is still not installed or enabled.

The frontend can read the field via `getGlobalSettings()`. Today, EN is blocked earlier by the HU-only route registration and prerender allow-list. When EN routes are later registered, the React/Vite SSR layer must also check this boolean and return a 404 for all `/en/*` routes unless it is exactly `true`.

---

## 5. Summary Counts

| Classification | Field count (approx.) |
|---|---|
| TRANSLATE | ~130 |
| SHARED | ~65 |
| LOCALE_RELATION | ~10 |
| REVIEW | ~15 |

**Total tracked fields:** ~220 across 14 content types and 34 components.

---

## 6. Fields NOT requiring translation

The following are either system-generated or logic-only:

- All `id`, `documentId`, `createdAt`, `updatedAt`, `publishedAt` system fields
- `isActive` (career-position) — boolean logic flag
- `featured`, `order` — display logic flags
- `draftAndPublish` status — managed per-locale separately
- `isCareer` (form-subject) — logic flag
- `variant` (deliverables-section) — enum layout code

---

*Last updated: 2025. Generated from schema inspection of artifacts/strapi/src.*
