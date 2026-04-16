# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 22
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── strapi/             # Strapi v5 CMS (content management)
│   └── works-website/      # Works. corporate website (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/works-website` (`@workspace/works-website`)

Works. corporate website — a Hungarian digital agency (UX research, service design, UI design, accessibility auditing, user research, AI-based design, web development).

- **Tech**: React 19, Vite, Tailwind CSS v4, Framer Motion, Wouter router, Lucide React icons
- **Font**: Mulish (Google Fonts, loaded in index.html)
- **Brand colors** (Tailwind custom tokens in index.css):
  - `works-primary` #E73352 (red)
  - `works-dark` #3F1C4A (dark purple)
  - `works-light` #f0edf1
  - `works-muted` #e3dbe5
  - `works-accent` #959EF1 (lavender)
  - `works-bg` #FAFAFA
  - `works-deepdark` #1A0C1F
- **Language**: All content in Hungarian
- **CMS integration**: Content fetched from Strapi CMS API at runtime via `src/lib/strapi.ts`. Data hook `src/hooks/useStrapiQuery.ts` provides caching and loading states. In production, Strapi API calls are disabled (`VITE_STRAPI_ENABLED=false`) — the hook returns null immediately and components use hardcoded fallback data. The pre-rendered static HTML contains all content.
- **Image handling**: Strapi media URLs (`/uploads/...`) are prefixed with `/strapi` for proxy routing. Hero/background images always come from static imports in `fallback.ts`, never CMS URLs.
- **SSG (Static Site Generation)**: Build-time pre-rendering of all pages. Uses Vite SSR build + custom prerender script (`scripts/prerender.mjs`). Each page gets its own `index.html` with pre-rendered HTML body and SEO meta tags. Client-side hydration via `hydrateRoot` when pre-rendered content exists, `createRoot` fallback for dev mode.
- **Routing**: Wouter — `/`, `/projektek`, `/projektek/:slug`, `/blog`, `/blog/:slug`, `/szolgaltatasok/:slug`, `/rolunk`, `/kapcsolat`, `/karrier`, `/karrier/:slug`
- **Assets**: Logo at `@assets/New_logo_1773998946128.png`, Hero graphic at `@assets/homepage_graphic_1773999340930.png`
- `pnpm --filter @workspace/works-website run dev` — start dev server

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)

### `artifacts/strapi` (`@workspace/strapi`)

Strapi v5 headless CMS for managing website content (projects, blog posts, services, careers, team).

- **Tech**: Strapi v5.40.0, PostgreSQL, React 18 (admin panel only)
- **Admin panel**: Accessible at `/strapi/admin` in the preview pane. Admin login: `admin@works.hu` / `Admin1234!`
- **REST API**: `/strapi/api/` — auto-generated CRUD endpoints for each content type (public read access enabled via bootstrap permissions)
- **Database**: All Strapi tables live in the `strapi` schema (separate from the `public` schema used by the api-server/Drizzle).
- **Production constraint**: Strapi does NOT run in production — development-only CMS; content is pre-rendered at build time into the static website.
- **Port**: 8099 (proxied through Replit at `/strapi`).
- **Bootstrap** (`src/index.ts`):
  - `ensurePublicPermissions()` — auto-configures Users & Permissions plugin public role with read access to all content types
  - `updateAllLabels()` — applies human-readable labels to CMS admin panel fields
  - `migrateWhyUsCardsToCareerPage()` — migrates legacy why-us cards to career page component
  - `migrateServicesToSections()` — restructures services with icons, howWeWork HTML, activities, benefits
  - `migrateSlugToGeneral()` — populates slug on service general components
  - `syncServiceTitles()` — syncs root title with general.title
- **Content types** (8 collection types): tag, team-member, client, why-us-card, service, project, blog-post, career-position
- **Content types** (7 single types): homepage, about-page, contact-page, career-page, blog-page, projects-page, global-setting
- **Service schema quirk**: `slug` lives inside `general` component (not root). Seed maps `{ slug, subtitle, heroDescription }` → `general`, and `{ valueQuestion, valueAnswer }` → `valueProposition`.
- **Career position schema**: No `location` or `type` fields — stripped from seed payload. Website adds defaults ("Budapest / Hybrid", "Teljes munkaidő").
- **Career page schema**: Uses `whyUs.sectionHeading` (nested component), not root-level field.
- **Seed script**: `scripts/seed.mjs` — seeds all content via REST API. Run with: create API token in Strapi admin (Settings → API Tokens → Full access), then `cd artifacts/strapi && STRAPI_SEED_TOKEN=<token> node scripts/seed.mjs`
- **Seeded data**: 24 tags, 25 images, 10 team members, 10 clients, 5 why-us cards, 3 services, 6 projects, 6 blog posts, 4 career positions, 7 single types with linked images

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Run scripts via `pnpm --filter @workspace/scripts run <script>`.
