---
name: Accessible terminology decisions
description: Preserve speech-control labels while helping screen readers interpret abbreviations.
---

Keep the complete visible label contiguous in its accessible name; append localized acronym definitions after the label rather than between its words. Preserve original letters and use language annotations, not guessed phonetic replacements.

**Why:** Keeping just the acronym somewhere in a name is insufficient for speech control. Inserting an invisible definition between “UX” and the following word breaks the original full label. Language switching also depends on the reader and installed voices, so it is not a guaranteed pronunciation fix.

**How to apply:** For future glossary or CMS-rendering changes, check whole link/button names and formatting boundaries, not just acronym presence. Distinguish DOM/accessibility-tree verification from actual NVDA/VoiceOver speech verification.

Public development-domain browser checks can encounter Replit's injected banner over the header; this is not an application navigation defect.

**Why:** The platform banner intercepted pointer clicks on otherwise visible language links during accessibility verification.

**How to apply:** Separate platform-overlay interference from application failures. Keyboard activation is appropriate when checking language changes for keyboard and screen-reader users; do not change application layout to work around the injected banner.

Keep the toast portal target mounted when suppressing an empty notification region from the accessibility tree, and consider open state rather than retained toast count.

**Why:** Radix needs the viewport to mount the first notification; the toast store retains dismissed entries during delayed cleanup. Removing the target or treating retained entries as active can respectively lose announcements or leave an empty reader stop.

**How to apply:** Preserve first-message announcement, active hotkey access, focus safety on dismissal, and reopening when changing notification accessibility.

Keep the contact form's subtle borders and original light red focus treatment unless the user explicitly requests a redesign.

**Why:** The user rejected the high-contrast dark borders and heavy dark focus ring, explicitly accepting lower border contrast. They approved the darker opening-hours text; the darker placeholders were retained.

**How to apply:** Do not reintroduce dark borders to meet a blanket contrast target. Treat text contrast separately and report the border limitation honestly.