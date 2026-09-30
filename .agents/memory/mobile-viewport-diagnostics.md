---
name: Mobile viewport diagnostics
description: Distinguish mobile layout viewport expansion from a narrow content container.
---

For mobile width regressions, compare visualViewport.width, window.innerWidth, document scrollWidth and fixed-header bounds, not screenshots or root width alone.

**Why:** a scrollable offscreen card track expanded the mobile layout viewport while the main content retained device width. This looked like a narrow left column and stretched the fixed header; global overflow-x-hidden did not prevent it.

**How to apply:** isolate the overflowing subtree and verify containment locally while preserving its internal scrolling. Test with mobile/touch browser emulation; a desktop browser resized to the same width can miss viewport expansion.

For carousel gesture bugs, measure card position relative to its track separately from document scrolling, using native touch input.

**Why:** clipped accessible text can still enlarge scrollable overflow, and horizontal auto overflow implicitly enables vertical auto overflow. A vertical swipe may be consumed by the track rather than the page even when screenshots look identical.

**How to apply:** compare before/after track offsets and document offsets on the same content. Preserve accessible text, page vertical scrolling and pinch zoom; a horizontal-only touch-action declaration can hide the symptom by trapping normal page gestures.