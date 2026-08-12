---
name: Icon recoloring on the Works. site
description: Why uploaded CMS icons are tinted via CSS mask, not filter chains.
---

Uploaded Strapi icons (black source files) are tinted to the brand red with CSS `mask-image` + `background-color` (MaskIcon component), NOT filter chains. **Why:** a `brightness/invert/sepia/hue-rotate` filter chain rendered orange-ish on mobile WebKit — browsers compute filter chains differently, masks give pixel-exact color everywhere. The user explicitly wants the brand-red tint (not native icon colors) and hover states only on cards that link somewhere (icon goes white on red via mask fill color).

**How to apply:** any new place rendering CMS icon media should reuse MaskIcon. Icons must be alpha-based SVG/PNG. If Strapi ever serves absolute third-party media URLs, those need CORS headers or masks render blank.
