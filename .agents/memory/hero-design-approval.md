---
name: Hero design approval
description: Confirmed hero direction and previously rejected layout changes.
---

The full-background hero direction was explicitly approved on 2026-09-10. Preserve it when making targeted refinements.

**Why:** The user approved right-anchored backgrounds behind white text, including on mobile, but previously rejected proportional height reduction and a new 1280px stacking breakpoint. Do not reintroduce those as unsolicited responsive improvements.

**How to apply:** Keep unrelated layout decisions unchanged during hero refinements. Reuse established site interaction styles instead of inventing contrasting button hover colors.

The subsequently approved height rule is a full visible viewport minus the unscrolled header, across all hero pages and devices. Content may exceed this minimum on short screens rather than being clipped.

**Why:** The user explicitly requested that every hero end at the screen bottom, superseding the earlier instruction to retain separate height variants. This does not authorize proportional text scaling or new layout breakpoints.

**How to apply:** Preserve viewport-based height during future visual edits, and keep the header offset independent of its scroll-shrink animation.

Dedicated mobile hero artwork was explicitly requested on 2026-09-14, superseding the earlier rejection of separate mobile graphics. Mobile artwork must be centered with symmetric cropping; desktop artwork remains right-anchored.

**Why:** The user supplied purpose-made portrait compositions and explicitly corrected mobile positioning to crop equally from both sides.

**How to apply:** Do not restore desktop-image crops on mobile based on the older approval. This change does not authorize text repositioning or the separate animated-SVG experiment.