---
name: Animated disclosure accessibility checks
description: Test inherited inertness rather than individual tabindex values during nested exit animations.
---

For animated disclosure exits, verify that descendants cannot actually receive focus; do not require every descendant to have tabindex=-1 when an ancestor is inert.

**Why:** Nested AnimatePresence boundaries can retain their own presence state while their parent exits. The browser still applies the parent's inertness to the entire subtree. An assertion requiring rewritten tabindex values incorrectly rejected this valid behavior.

**How to apply:** Check the closing boundary's inert and aria-hidden state and attempt descendant focus during the exit. Also accept an already-unmounted panel; animation timing is not an accessibility requirement.