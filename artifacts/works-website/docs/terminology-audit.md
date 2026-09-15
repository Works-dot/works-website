# Terminology audit

**Baseline:** the prerendered `dist/public` output that existed before the
terminology implementation was rebuilt  
**Audit date:** 2026-03-26  
**Pages:** 123 HTML files (62 HU, including the 404 page; 61 EN)

This is an inventory of content that was actually rendered in the baseline.
It is not a count of source-code keywords.  The audit was run with the
standard-library `HTMLParser` implementation in
`scripts/audit-terminology.py`.  The parser is deliberately small and
deterministic so the same route-level baseline can be used for a later
prerender comparison.

## Baseline artefacts and coverage

`/tmp/terminology-baseline.json` was captured before the rebuild.  Its schema
version is 1 and it contains one record per HTML route with:

- `route`, `file`, `language`, `html_lang` and `page_family`;
- normalized visible text from `main` (`main_visible_text`);
- ordered `main_headings`;
- the main-content links as `href`, visible link text and optional `lang`;
- main form-control `value` records (including tag, name and type);
- visible shared header/footer text;
- rendered `alt` and `aria-label` values as a separate accessible-attribute
  inventory.

The main baseline fields are intended for an after-build regression check:
visible text, headings, links and native control values must remain unchanged.
They are not a replacement for a visual check or a speech-output check.

The parser excludes `head`, metadata elements, scripts, styles, templates and
`noscript`, and does not count nodes hidden with `hidden`, `aria-hidden`,
screen-reader-only classes, or explicit CSS `display:none`/
`visibility:hidden`.  Responsive `hidden md:flex`-style navigation is treated
as visible at the desktop prerender width.  Main content is counted separately
from repeated `header` and `footer` content.  `alt` and `aria-label` are
reported separately because they are accessible names/alternative text, not
visible prose.  Decorative images with an empty `alt` therefore contribute no
term.

### Page-family inventory

| Family | Total | HU | EN | Examples |
| --- | ---: | ---: | ---: | --- |
| Home | 2 | 1 | 1 | `/`, `/en` |
| Services index | 2 | 1 | 1 | `/szolgaltatasok`, `/en/services` |
| Service detail | 12 | 6 | 6 | `/szolgaltatasok/ux-ui-design`, `/en/services/ux-ui-design` |
| Projects index | 2 | 1 | 1 | `/projektek`, `/en/projects` |
| Case study/project detail | 42 | 21 | 21 | `/projektek/rudas-service-design`, `/en/projects/rudas-service-design` |
| Blog index | 2 | 1 | 1 | `/blog`, `/en/blog` |
| Blog post | 50 | 25 | 25 | `/blog/elveheti-az-ai-a-munkamat`, `/en/blog/can-ai-take-my-job` |
| About | 2 | 1 | 1 | `/rolunk`, `/en/about` |
| Careers index | 2 | 1 | 1 | `/karrier`, `/en/careers` |
| Career detail | 2 | 1 | 1 | `/karrier/ux-researcher`, `/en/careers/ux-researcher` |
| Contact | 2 | 1 | 1 | `/kapcsolat`, `/en/contact` |
| Legal/privacy | 2 | 1 | 1 | `/adatkezeles`, `/en/privacy` |
| Cookies | 2 | 1 | 1 | `/sutik`, `/en/cookies` |
| Utility/404 | 1 | 1 | 0 | `/404` |
| **Total** | **123** | **62** | **61** | |

The SSR `html lang` values were `hu` and `en` for the corresponding route
families.  The existing localized root attribute is correct and must be
preserved; the terminology work does not need to recreate it.

## What the baseline contains

The counts below are occurrences in the extracted visible main text, repeated
shared header/footer text and rendered `alt`/`aria-label` values.  The
`routes` column is the number of distinct routes containing at least one
occurrence.  A shared occurrence is intentionally visible in the count so
that a future implementation does not fix only CMS prose and miss navigation,
footer or accessible-name paths.

| Term | Occurrences | Routes | Main | Shared header/footer | `alt`/`aria-label` | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `AI` | 650 | 122 | 466 | 122 | 62 | Core |
| `UX` | 484 | 122 | 354 | 122 | 8 | Core |
| `UX/UI` | 373 | 122 | 123 | 244 | 6 | Core; longest match |
| `service design` | 316 | 122 | 166 | 122 | 28 | Required phrase |
| `UI` | 44 | 20 | 44 | 0 | 0 | Core |
| `design system` | 53 | 20 | 53 | 0 | 0 | Required phrase |
| `wireframe` | 33 | 10 | 31 | 0 | 2 | Required phrase |
| `workshop` | 30 | 18 | 28 | 0 | 2 | Required phrase |
| `dashboard` | 6 | 4 | 4 | 0 | 2 | Required phrase |

The shared counts are high because the same footer/service navigation is
rendered on nearly every route.  They are not evidence of 122 independent
editorial uses.

### Representative route/context evidence

These are representative real routes, not a dump of page text:

- `/szolgaltatasok/ux-ui-design` and `/en/services/ux-ui-design`: service
  heading and description use `UX/UI`, `wireframe`/`wireframes`, `UI design`
  and `design system`/`design systems`.
- `/` and `/en`: service cards expose `UX Research`, `UX/UI Design`, `Service
  design` and AI-related service wording in ordinary card headings and
  descriptions.
- `/blog/elveheti-az-ai-a-munkamat` and
  `/en/blog/can-ai-take-my-job`: editorial prose and image alternatives use
  `AI`; the article also contains `LLM` and `WER`/`Word Error Rate`.
- `/en/projects/ai-simulation-for-ivr-validation`: the project title,
  description and image alternative use `IVR`.
- `/blog/digitalis-akadalymentesites` and `/en/blog/digital-accessibility`:
  the article discusses `WCAG`, `WAD`, `EAA`, `W3C` and accessibility
  standards.  These are content-specific terms, not site-wide navigation.
- `/blog/nalunk-a-munkatarsak-a-sztarok`: `B2B` occurs in the editorial
  discussion of the business-to-business segment.
- `/blog/bizzuk-az-ai-ra-a-felhasznaloi-visszajelzesek-elemzeset` and its EN
  counterpart: `API` and `NLP` occur in the AI-model comparison.
- `/blog/amikor-a-design-ujra-keresi-a-helyet` and
  `/blog/miert-buknak-el-a-cx-kezdemenyezesek`: `CX`, `POC` and
  `workshop` are used in editorial context.
- `/projektek/digitalis-termektervezes-idomenedzsment-platformhoz` and
  `/en/projects/digital-product-design-for-time-management-platform`: the
  project image alternative and description contain `Dashboard`/`dashboard`
  and `design system`.

## Glossary decisions

The glossary is a speech-support policy, not a request to rewrite the
visible editorial language.  Original letters and capitalization remain in
the visible label.  The recommended HU/EN definitions below are explanatory
text for the accessible output; they are not phonetic spellings.

### Core terms included

These terms are included in the first shared glossary and should be handled in
plain text, Markdown, cards, navigation, links/buttons, labels, image
alternatives, captions and accessible names wherever they actually occur:

| Label kept in the content | HU definition | EN definition | Baseline evidence |
| --- | --- | --- | --- |
| `UX` | user experience — felhasználói élmény | user experience | 484 occurrences / 122 routes |
| `UI` | user interface — felhasználói felület | user interface | 44 / 20 |
| `UX/UI` | user experience és user interface — felhasználói élmény és felület | user experience and user interface | 373 / 122 |
| `AI` | artificial intelligence — mesterséges intelligencia | artificial intelligence | 650 / 122 |
| `WCAG` | Web Content Accessibility Guidelines — webtartalom-akadálymentesítési irányelvek | Web Content Accessibility Guidelines | 73 / 20 |
| `CX` | customer experience — ügyfélélmény | customer experience | 38 / 8 |
| `IVR` | interactive voice response — interaktív hangalapú válaszrendszer | interactive voice response | 30 / 10 |
| `B2B` | business-to-business — vállalkozások közötti | business-to-business | 6 / 2 |
| `LLM` | large language model — nagy nyelvi modell | large language model | 7 / 3 |
| `API` | application programming interface — alkalmazásprogramozási felület | application programming interface | 6 / 2 |
| `NLP` | natural language processing — természetesnyelv-feldolgozás | natural language processing | 6 / 2 |
| `POC` | proof of concept — koncepció igazolása | proof of concept | 8 / 4 |

`UX/UI` must be matched before its component abbreviations.  A standalone
`UX` or `UI` in a compound or suffixed form must still retain the original
label; the solution must not turn `UX/UI` into two adjacent definitions or
apply the same definition again on a second render.

### Additional glossary entries implemented

These were evidenced in the baseline and are included in the shared glossary:

| Label | Recommended expansion | Evidence |
| --- | --- | ---: |
| `KPI` | key performance indicator — kulcs teljesítménymutató | 3 / 1 route |
| `SEO` | search engine optimization — keresőoptimalizálás | 4 / 4 routes |
| `GPT` | generative pre-trained transformer — generatív, előre betanított transzformer | 2 / 2 routes |

The definitions are intentionally semantic.  They do not promise a particular
Hungarian voice's pronunciation of the letters.

### Candidate, contextual or currently unresolved terms

The following terms are real baseline evidence but are **not** a blanket rule
that every English word must receive `lang="en"` or a definition.  Add an
entry only when the context and target audience justify it, and document the
decision in the glossary:

| Term | Evidence | Recommended status |
| --- | ---: | --- |
| `WER` / Word Error Rate | 2 / 2 routes | Candidate; in the AI transcription article, use “Word Error Rate — szóhibaarány” when retained. |
| `WAD` / Web Accessibility Directive | 4 / 2 routes | Candidate; expand as “Web Accessibility Directive — web akadálymentesítési irányelv” at its first relevant occurrence. |
| `EAA` / European Accessibility Act | 2 / 2 routes | Candidate; expand as “European Accessibility Act — európai akadálymentességi jogszabály” in the accessibility article. |
| `W3C` / World Wide Web Consortium | 4 / 4 routes | Candidate; it is an organization name, so preserve the name and add an explanatory definition only where needed. |
| `UX research` | 146 / 43 routes | Existing professional phrase; localize/define in HU context, do not rewrite EN content. |
| `UI design` | 102 / 37 routes | Existing professional phrase; contextual phrase treatment. |
| `feedback` | 80 / 34 routes | Candidate; define only in HU text where “visszajelzés” is not already the visible wording. |
| `prototype` | 48 / 11 routes | Candidate; define or translate by sentence context, not globally. |
| `microinteraction` | 28 / 28 routes | Candidate; specialist term, context-sensitive. |
| `insight` | 22 / 12 routes | Candidate; “insight” and the Hungarian wording are not always interchangeable. |
| `prompt` | 17 / 17 routes | Candidate; primarily in AI editorial content. |
| `lo-fi` | 36 / 4 routes | Candidate; preserve the author’s label and explain “low-fidelity” where useful. |
| `benchmark` | 9 / 5 routes | Candidate; do not mark every common business loanword automatically. |
| `best practice` | 2 / 2 routes | Candidate; contextual explanation only. |
| `landing page`, `chatbot`, `design thinking` | 2 / 2, 2 / 2, 3 / 3 | Candidate; review the specific article sentence. |

`service design`, `design system`, `workshop`, `wireframe` and `dashboard`
are required phrases from the task brief and are therefore included even when
they appear as established professional loanwords.  Other English phrases
remain contextual candidates until an author confirms that the English label
is intentional and potentially unclear when spoken.

## Rendering and language policy

1. Keep the original visible letters, capitalization, punctuation and label.
   Never replace `UX` with an invented phonetic spelling.
2. Append a localized, visually hidden definition once per acronym per
   rendered text fragment, after the complete label. The original full label
   stays contiguous in the accessible name, including multi-word labels.
   Reprocessing or hydration must not append a second definition.
3. Use the HU expansion on HU pages and the EN expansion on EN pages.
4. Mark a genuinely retained foreign phrase with `lang="en"` at the smallest
   meaningful text span.  `lang` is useful metadata, not a guaranteed
   pronunciation instruction; it does not replace a definition. In plain-text
   attributes, append a localized explanation instead because `lang` cannot
   annotate a substring of an image alternative or an accessible name.
5. Do not use an `abbr title` as the only fix.  Do not add phonetic guesses or
   change brand/product names merely to influence a voice.
6. Link and button names must continue to contain the visible label for
   speech control.  Add supporting text rather than replacing the complete
   accessible name with a phonetic or translated substitute.
7. Attribute values such as `alt`, `aria-label` and native option
   labels cannot contain HTML.  Handle them with plain text or an explicit
   text variant.  Do not inject markup into an attribute.  Decorative image
   `alt=""` stays empty. Input values are not transformed.
8. Apply the same safe, context-aware rendering to shared UI, CMS Markdown,
   cards, headings, form labels/messages, captions, image alternatives,
   accessible names and the separately rendered cookie-consent text.  This is
   not a global DOM/string replacement.
9. Preserve rich-text semantics and formatting.  Markdown caption formatting
   remains the separate existing task; terminology handling must not introduce
   it.
10. Native `<select>` options can expose only plain labels.  They cannot carry
    an HTML definition span; use a plain localized option label when that is
    the only available output.

## Regression and speech-test status

### Visible-content regression baseline

The route baseline covered **123/123 prerendered HTML pages** before the
rebuild.  The implementation comparison reports unchanged main visible text,
heading text, main `href` records and native control `value` records across
the same 123 routes.  This is the required content-preservation result; any
future intentional copy change should update the baseline with an explicit
review rather than silently accepting a diff.

### Browser checks

The implementation verification covered **30 representative HU/EN routes**
across home, service detail, project/case study, blog index/post,
about, career listing, contact and cookie paths. The browser
checks passed for the intended rendered labels, language markers, accessible
names and no-duplication behavior.

An accessibility-tree or DOM assertion is not a speech test.  It can confirm
that a definition exists once and that a visible label remains in the name,
but it cannot confirm what a particular voice says aloud.

### Genuine speech matrix — NOT RUN

The following matrix is explicitly **NOT RUN in this task**:

| Screen reader | Browser | HU voice path | EN voice path | Status |
| --- | --- | --- | --- | --- |
| NVDA | Firefox | Test the HU abbreviation/definition output | Test EN output | **NOT RUN** |
| NVDA | Chrome | Test the HU abbreviation/definition output | Test EN output | **NOT RUN** |
| VoiceOver | Safari | Test the HU abbreviation/definition output | Test EN output | **NOT RUN** |

No claim is made that all voices pronounce the original letters identically.
The browser/accessibility checks above must not be reported as “heard”
validation.

### Boundaries

- External PDFs, including the linked privacy PDF, and third-party iframes are
  outside this inventory and implementation scope.
- Source-code keyword counts, metadata descriptions, JSON-LD and URL slugs
  are not evidence of a user hearing a term.
- A phrase is not automatically foreign merely because it contains an
  English-looking word.  Context, page language and the author’s intended
  label decide whether it receives `lang="en"` or a localized definition.
- No visual redesign, CMS bulk rewrite or promise of a universal speech
  pronunciation is implied.

## Final implementation checks

- TypeScript check and production build passed; 123 routes prerendered.
- 13 core tests passed, including formatted `**UX**/UI`, pre-existing
  definitions split by emphasis, Markdown image alt, suffixes and idempotence.
- A corpus-level check passed over all 123 built HTML routes, checking required
  term occurrences individually rather than only looking for some markup on
  each page. It also verified 100 meaningful image alternatives: 72 containing
  acronyms and 28 containing the required foreign phrases.
  Run: `pnpm --dir artifacts/works-website exec tsx scripts/test-terminology-corpus.ts`.
- Actual Hungarian forms `wireframe-tervezés`, `wireframe-eket`,
  `service designnal` and `workshopolni` are covered. English base words receive
  language markup; Hungarian suffixes remain outside it. Plain-text attributes
  receive localized explanations. URL/path/email/code exclusions remain, as
  does protection for ambiguous lowercase ASCII bare slugs.
- The 30-route HU/EN browser pass covered representative public page families.
  After correcting definition placement, a focused desktop/mobile regression
  confirmed that complete visible service-link labels remain contiguous in
  their accessible names and definitions occur once.
- All 123 baseline routes retain the same main-content characters and headings
  after whitespace normalization, with exact link destinations and input values.
  The initial baseline parser inserted spaces at inline-element boundaries;
  comparison therefore ignores those parser-generated whitespace differences.
  The retained audit script now preserves inline whitespace correctly and fails
  explicitly when the prerendered directory is missing or empty.
- A desktop UX service-page screenshot showed no manifest layout problem.
- No GitHub push, publication or CMS data mutation was performed.
- None of these checks is an NVDA/VoiceOver synthesized-speech test.

## Future glossary author instructions

When adding a term:

1. Cite a real rendered route and the sentence/label context.
2. Record HU and EN expansions separately; preserve the original label.
3. Decide whether it is an acronym, an intentional foreign phrase, a brand
   name, or an ordinary loanword.  Only the first two normally need this
   treatment.
4. Define the smallest rendering fragment and verify the definition is
   appended once, not once per nested element or hydration pass.
5. Check word boundaries, capitalization, `UX/UI` longest-match behavior,
   hyphenated and suffixed forms, and exclusion of URLs, email addresses,
   code, input values and longer words containing the letters.
6. Confirm that links and buttons retain their visible names, `alt` stays
   plain text, decorative images stay empty, and native options stay plain.
7. Add a route-family example in the audit and update the baseline comparison
   only when visible text, headings, links or values intentionally change.
8. For any speech claim, document a real screen-reader/voice/browser
   combination separately.  Never label an accessible-tree assertion a
   speech test.