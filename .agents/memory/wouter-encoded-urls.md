---
name: Wouter encoded URL measurements
description: Wouter decoded route snapshots cannot be treated as raw analytics URLs.
---

Keep analytics URLs byte-for-byte consistent with the browser pathname and query, while checking that SEO readiness belongs to the same route.

**Why:** Wouter's location/search hooks decode URI characters. Reconstructing an analytics URL from those values caused encoded query navigation to lose its page-view event when compared with the raw browser URL. Different raw URLs can also have the same decoded hook values.

**How to apply:** Check raw URL subscriptions and stale-render identity separately whenever adding navigation-dependent side effects. Regression cases must include encoded spaces, percent signs, non-ASCII paths, and browser history, not just plain ASCII query values.