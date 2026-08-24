---
name: React head ownership
description: Why Works. SEO tags use explicit SSR/client ownership instead of React head hoisting plus Helmet.
---

Prerendered SEO tags and their hydrated replacements must have one explicit owner. Mark server-generated tags, replace only that owned set on the client, and keep route-level code splitting independent from metadata management.

**Why:** mixing React 19 native document-head hoisting, `react-helmet-async`, and separately injected prerender tags caused React to remove a head node that Helmet had already detached. Client navigation then crashed with a null `removeChild` parent and left a blank page. Unmarked JSON-LD also survived hydration and produced stale duplicates.

**How to apply:** do not reintroduce Helmet around route content. Server-generated title/meta/JSON-LD tags must carry the SSR ownership marker; client SEO synchronization adopts or replaces those tags and removes stale article-only data during route changes. Keep lazy client routes for code splitting, and validate against the built prerendered site, not only the Vite dev server. The release gate and its browser test must build with the same runtime-content mode; otherwise a passing test can cover a different hydration path than production.