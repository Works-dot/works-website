---
name: Intentional empty CMS content
description: Empty editorial collections must not restore fabricated content.
---

Treat a successful empty CMS collection as intentional removal, not missing data. Never replace removed job listings with demonstration jobs; distinguish empty results from service errors.

**Why:** Removing the sole published job caused four fictitious listings to appear through a nonempty-array fallback. The user explicitly rejected this behavior.

**How to apply:** Audit both static snapshots and client fallback consumers when changing CMS collections. Do not generalize an array-length check into permission to republish hardcoded editorial content.