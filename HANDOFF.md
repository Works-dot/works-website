# Works. Project Handoff

## Project Overview

Corporate website for **Works.** — a Hungarian digital agency specializing in UX research, service design, UI design, accessibility auditing, and web development. All content is in **Hungarian**.

**Live preview**: The website runs as a React + Vite SPA in development, and as pre-rendered static HTML pages in production.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Package manager | pnpm (workspaces) | 10.x |
| TypeScript | | ~5.9 |
| Frontend | React + Vite + Tailwind CSS v4 | React 19, Vite 7 |
| Animation | Framer Motion | 12.x |
| Router | Wouter | |
| Icons | Lucide React | |
| CMS | Strapi v5 | 5.40.0 |
| Database | PostgreSQL (Helium/Neon) | 16 |
| ORM (api-server) | Drizzle ORM | |
| API | Express 5 | |

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── works-website/      # Main website (React + Vite + Tailwind)
│   ├── strapi/              # Strapi v5 CMS (dev-only, port 8099)
│   ├── api-server/          # Express API server (port 8080)
│   └── mockup-sandbox/      # Component preview sandbox (dev tool)
├── lib/
│   ├── db/                  # Drizzle ORM schema + DB connection
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod schemas
├── scripts/
│   └── post-merge.sh        # Post-merge dependency & service setup
├── attached_assets/         # User-uploaded design assets (28 files)
├── pnpm-workspace.yaml
├── package.json
└── .replit
```

---

## Brand & Design System

| Token | Value |
|---|---|
| Font | **Mulish** (Google Fonts, loaded in index.html) |
| `works-primary` | #E73352 (red) |
| `works-dark` | #3F1C4A (dark purple) |
| `works-light` | #f0edf1 |
| `works-muted` | #e3dbe5 |
| `works-accent` | #959EF1 (lavender) |
| `works-bg` | #FAFAFA |
| `works-deepdark` | #1A0C1F |
| Corners | **NO rounded corners** — sharp/square everywhere |

Logo: `artifacts/works-website/src/assets/New_logo_1773998946128.png`
Hero graphic: `artifacts/works-website/src/assets/homepage_graphic_1773999340930.png`

---

## Website Pages & Routes

| Route | Page | Component |
|---|---|---|
| `/` | Főoldal (Homepage) | `Home.tsx` |
| `/projektek` | Projektek (Projects listing) | `Projektek.tsx` |
| `/projektek/:slug` | Esettanulmány (Case Study) | `CaseStudy.tsx` |
| `/blog` | Blog listing | `Blog.tsx` |
| `/blog/:slug` | Blog cikk (Article) | `BlogPost.tsx` |
| `/szolgaltatasok/:slug` | Szolgáltatás (Service page) | `ServicePage.tsx` |
| `/rolunk` | Rólunk (About) | `About.tsx` |
| `/kapcsolat` | Kapcsolat (Contact) | `Contact.tsx` |
| `/karrier` | Karrier (Career listing) | `Karrier.tsx` |
| `/karrier/:slug` | Karrier pozíció (Career detail) | `CareerDetail.tsx` |

**Total pages**: ~25 (6 static + 6 projects + 6 blog + 3 services + 4 careers)

Header "Szolgáltatások" has a hover dropdown (desktop) and expandable submenu (mobile) listing the 3 services.

---

## Works Website (`artifacts/works-website`)

### Key Files

| File | Purpose |
|---|---|
| `src/pages/*.tsx` | Page components |
| `src/components/` | Reusable components (ServiceCard, ProjectCard, BlogCard, etc.) |
| `src/data/fallback.ts` | **Static fallback data** — hero graphics and bg images are ALWAYS static imports from here |
| `src/data/strapi-cache.json` | Build-time CMS data snapshot |
| `src/data/projects.ts` | Project data |
| `src/data/blog-posts.ts` | Blog post data |
| `src/data/services.ts` | Service data (3 services) |
| `src/data/careers.ts` | Career position data (4 positions) |
| `src/data/team.ts` | Team member data |
| `src/lib/strapi.ts` | Strapi API client |
| `src/hooks/useStrapiQuery.ts` | CMS data hook with caching |
| `src/seo-data.ts` | SEO meta data for all routes |
| `src/components/SEOHead.tsx` | react-helmet-async for `<title>` updates |
| `src/entry-server.tsx` | Server entry for SSG |
| `scripts/prerender.mjs` | SSG prerender script |
| `scripts/fetch-strapi-data.mjs` | Fetches all CMS data → strapi-cache.json |
| `vite.config.ts` | Vite config |

### Build Process (SSG)

```bash
# Full build command:
vite build                                    # Phase 1: Client bundle → dist/public
vite build --ssr src/entry-server.tsx          # Phase 2: SSR bundle → dist/server
node scripts/prerender.mjs                    # Phase 3: Pre-render all 25 pages
```

### CMS Integration Pattern

- **Development**: `VITE_STRAPI_ENABLED=true` → live API calls to Strapi
- **Production**: `VITE_STRAPI_ENABLED=false` → hook returns null, components use hardcoded fallback data from `src/data/*.ts` + `strapi-cache.json`
- **Build-time fetch**: `scripts/fetch-strapi-data.mjs` fetches all content from Strapi API and writes to `strapi-cache.json`
- **Image handling**: Strapi media URLs (`/uploads/...`) are prefixed with `/strapi` for proxy routing

### CRITICAL RULE: Hero & Background Images
Hero graphics and background images must ALWAYS be static imports from `fallback.ts`. Never use CMS URLs for these — they break in production where Strapi is not running.

---

## Strapi CMS (`artifacts/strapi`)

### Access

| Setting | Value |
|---|---|
| Port | 8099 |
| Admin URL | `/strapi/admin` |
| API base | `/strapi/api/` |
| Admin email | `admin@works.hu` |
| Admin password | `Admin1234!` |

### Content Types (8 Collections)

1. **service** — slug (in `general` component), title, subtitle, heroDescription, valueQuestion, valueAnswer, order, heroImage, activities[], benefits[], tools[], processSteps[], seo
2. **project** — slug, title, description, featured, tags[], services[], caseStudy, contentBlocks[], seo
3. **blog-post** — slug, title, excerpt, date, readingTime, author, tags[], contentBlocks[], seo
4. **career-position** — slug, title, team, location, type, isActive, excerpt, tags[], contentBlocks[], seo
5. **tag** — name, slug
6. **team-member** — name, title, email, linkedin, order
7. **client** — name, initials, order, featured
8. **why-us-card** — title, description, order (legacy — migrated to career-page)

### Content Types (7 Single Types)

homepage, about-page, contact-page, career-page, blog-page, projects-page, global-setting

### Components (21 total)

- `shared.*`: seo, hero, social-link, opening-hours, legal-link, section-heading, form-subject
- `content.*`: text-block, highlight-block, image-block
- `service.*`: activity, benefit, tool, process-step, general
- `project.*`: case-study
- `page.*`: intro-block, cta-banner, clients-section
- `homepage.*`: services-section, projects-section, blog-section

### Schema Format
All schemas are `.ts` files with `export default {...}` — required for Strapi v5 TypeScript mode.

### Bootstrap (`src/index.ts`)

The bootstrap function does:
1. **`updateAllLabels`** — Programmatically sets admin UI labels, field order, list view columns. Runs synchronously BEFORE server starts (critical timing — if inside `httpServer.once("listening")`, admin loads stale config).
2. **Migrations** (run-once, flagged in `plugin::migrations` store):
   - `service_sections_v1` — Restructured Service content type with activities, benefits, process steps
   - `service_slug_to_general_v1` — Moved slug from root to `general` component
   - `migrateWhyUsCardsToCareerPage` — Uses data-existence check, no flag
3. **`syncServiceTitles`** — Ensures top-level `title` matches `general.title`

### Lifecycle Hooks

- `api/service/content-types/service/lifecycles.ts` — `beforeCreate`/`beforeUpdate` syncs `title` from `general.title`

### Seed Script

```bash
cd artifacts/strapi && node scripts/seed.mjs
```
Seeds: 24 tags, 10 team members, 10 clients, 5 why-us cards, 3 services, 6 projects, 6 blog posts, 4 career positions, 7 single types + uploads 24 images.

### Secrets (in `artifacts/strapi/.env`)

| Variable | Purpose |
|---|---|
| `STRAPI_APP_KEYS` | Session signing keys |
| `ADMIN_JWT_SECRET` | Admin JWT |
| `API_TOKEN_SALT` | API token salt |
| `TRANSFER_TOKEN_SALT` | Transfer token salt |
| `JWT_SECRET` | User JWT |
| `STRAPI_SEED_TOKEN` | Seed script auth token |

**IMPORTANT**: These secrets must be regenerated or copied to the new environment.

---

## Production / Deployment

### Critical Constraint

**Strapi does NOT run in production.** The Helium PostgreSQL hostname is not resolvable in autoscale deployment containers. The `.replit` deployment target is `autoscale` (system restriction, cannot change to `vm`).

**Production architecture**:
- Website = pre-rendered static HTML pages
- All CMS content is baked in at build time via `strapi-cache.json`
- Strapi is development-only (content editing tool)
- API server runs but is not used by the website

### Deployment Config (`.replit`)

```toml
[deployment]
router = "application"
deploymentTarget = "autoscale"
```

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Global | PostgreSQL connection (auto-provided by Replit) |
| `PORT` | Per artifact | Server port (auto-assigned) |
| `BASE_PATH` | works-website | URL base path |
| `STRAPI_URL` | works-website | Strapi API base (default: `http://localhost:8099`) |
| `VITE_STRAPI_ENABLED` | works-website | Enable/disable live CMS (`true` in dev, `false` in prod) |
| `NODE_ENV` | Various | Environment flag |
| `STRAPI_DATABASE_URL` | strapi | Falls back to `DATABASE_URL` |

---

## Workflows (Dev Servers)

| Workflow | Command | Port |
|---|---|---|
| API Server | `pnpm --filter @workspace/api-server run dev` | 8080 |
| Works Website | `pnpm --filter @workspace/works-website run dev` | 20022 |
| Strapi CMS | `PORT=8099 STRAPI_ADMIN_BACKEND_URL=/strapi pnpm --filter @workspace/strapi run dev` | 8099 |
| Mockup Sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` | (dev tool) |

---

## Post-Merge Script (`scripts/post-merge.sh`)

Runs automatically after task agent merges:
1. `pnpm install --frozen-lockfile` (fallback: `pnpm install`)
2. `pnpm --filter db push` (database schema sync)
3. Checks if services are running on their ports; starts them via `nohup` if not
4. Health-checks with timeouts (15–60s per service)

---

## Known Quirks & Gotchas

1. **Strapi v5 list view rule**: A field MUST be present in the edit layout to appear as a list view column. Filtering a field from the edit layout also removes it from the list view.
2. **Bootstrap timing**: `updateAllLabels` must run as `await updateAllLabels(strapi)` directly in bootstrap, NOT inside `httpServer.once("listening")` callback — otherwise admin frontend loads stale config.
3. **Service `slug` field**: Lives inside the `general` component, NOT at root level. Frontend filters with `filters[general][slug][$eq]=`.
4. **Service `title` field**: Root-level field, synced from `general.title` via lifecycle hook. Must be in edit layout row 0 for list view.
5. **Strapi uses React 18** internally; works-website uses React 19. Both coexist via pnpm isolation.
6. **Database schemas**: Strapi uses `strapi` schema; api-server/Drizzle uses `public` schema.
7. **Post-merge script**: Uses `/dev/tcp/localhost/PORT` for port checks.
8. **Strapi v5 upload API**: Uses `filepath`, `originalFilename`, `mimetype` (not the v4 API shape).
9. **Newsletter**: Client-side mock only (simulated delay + toast) — no backend endpoint.
10. **SSG caveat**: The `prerender.mjs` script must be run after both client and server builds complete.

---

## Content Summary (Current State)

- **3 Services**: UX Kutatás, UI Design, Akadálymentesítés
- **6 Projects**: With case study pages, tag-based filtering
- **6 Blog Posts**: With featured post layout
- **4 Career Positions**: With "Why work with us" cards
- **10 Team Members**: With photos
- **10 Clients**: With marquee display
- **24 Tags**: For categorization

---

## Getting Started (New Environment)

### What's in the archive
The `works-project.tar.gz` (41 MB) contains ALL source code, configs, assets, and seed scripts.
It excludes: `node_modules/`, `dist/`, `.git/`, `.strapi/`, `artifacts/strapi/public/uploads/` (regenerated by seed).

### Step-by-step setup

1. **Create a new Repl** — choose "Import from file" or create a blank Node.js Repl, then upload and extract the tar.gz
2. **Extract** (if uploaded as file): `tar xzf works-project.tar.gz`
3. **Install dependencies**: `pnpm install`
4. **Database**: Replit auto-provisions PostgreSQL and sets `DATABASE_URL`. Add a PostgreSQL database to the Repl if not already present.
5. **Strapi secrets**: The file `artifacts/strapi/.env` is included in the archive. If starting fresh, regenerate the secrets.
6. **Push DB schema**: `pnpm --filter @workspace/db run push` (creates Drizzle tables in `public` schema)
7. **Start Strapi**: `PORT=8099 STRAPI_ADMIN_BACKEND_URL=/strapi pnpm --filter @workspace/strapi run dev`
   - First boot creates all Strapi tables in the `strapi` schema automatically
   - Bootstrap migrations run automatically
   - Wait until you see "Strapi started" in the console
8. **Create Strapi admin user**: Go to `/strapi/admin` in preview and register (email: `admin@works.hu`, password: `Admin1234!`)
9. **Create API token for seeding**:
   - In Strapi admin: Settings → API Tokens → Create new → Name: "Seed", Type: "Full access"
   - Copy the token
10. **Run seed script**: `cd artifacts/strapi && STRAPI_SEED_TOKEN=<paste-token-here> node scripts/seed.mjs`
    - This creates all content (services, projects, blog posts, careers, team, clients, tags) and uploads all images
11. **Start website**: `pnpm --filter @workspace/works-website run dev`
12. **Start API server**: `pnpm --filter @workspace/api-server run dev`
13. **Set up workflows** in Replit (see Workflows section above) so the services auto-start

### Verification
- Website at `/` should show the full homepage with services, projects, clients, blog
- Strapi admin at `/strapi/admin` should show all content types populated
- All 25 pages should be navigable

---

## Task History (Completed — 115 tasks)

Major milestones:
- Tasks #1–#3: Header, homepage, footer, hero
- Tasks #4–#9: Design polish, images, service cards, project badges
- Tasks #10–#11: Project pages + mockup images
- Tasks #12–#16: Blog pages, cards, mockup images
- Tasks #17: Encoding fix + hover animations
- Tasks #18–#21: Service pages + dropdown menu
- Tasks #22+: About, Contact, Career pages
- Tasks #50+: Strapi CMS integration, content types, seed scripts
- Tasks #100+: Strapi admin UX (labels, layouts, list columns, migrations)
- Tasks #112–#115: Service slug → general component, title field sync, list view fix
