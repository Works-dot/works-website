/**
 * Shared terminology handling for visible copy, Markdown and accessible names.
 *
 * The terminology pass deliberately creates elements through React/remark data
 * rather than emitting HTML strings. This keeps the original text in the
 * accessibility tree (important for label-in-name) while allowing the English
 * abbreviations and terms to be announced with the right language.
 */

export type TerminologyLocale = "hu" | "en";

type TerminologyTermKind = "acronym" | "phrase";

interface TerminologyTerm {
  readonly key: string;
  readonly kind: TerminologyTermKind;
  readonly matches: readonly string[];
  readonly definition?: Readonly<Record<TerminologyLocale, string>>;
}

/**
 * Terms are intentionally explicit and small. In particular, acronym matching
 * is case-sensitive: `AI` is a deliberate acronym, not the `ai` sequence in a
 * Hungarian word such as `mai`.
 */
export const TERMINOLOGY_GLOSSARY: readonly TerminologyTerm[] = [
  {
    key: "ux-ui",
    kind: "acronym",
    matches: ["UX/UI", "UX / UI"],
    definition: {
      hu: "felhasználói élmény és felhasználói felület",
      en: "user experience and user interface",
    },
  },
  {
    key: "ux",
    kind: "acronym",
    matches: ["UX"],
    definition: {
      hu: "felhasználói élmény",
      en: "user experience",
    },
  },
  {
    key: "ui",
    kind: "acronym",
    matches: ["UI"],
    definition: {
      hu: "felhasználói felület",
      en: "user interface",
    },
  },
  {
    key: "ai",
    kind: "acronym",
    matches: ["AI"],
    definition: {
      hu: "mesterséges intelligencia",
      en: "artificial intelligence",
    },
  },
  {
    key: "wcag",
    kind: "acronym",
    matches: ["WCAG"],
    definition: {
      hu: "webtartalom-akadálymentesítési irányelvek",
      en: "Web Content Accessibility Guidelines",
    },
  },
  {
    key: "cx",
    kind: "acronym",
    matches: ["CX"],
    definition: {
      hu: "ügyfélélmény",
      en: "customer experience",
    },
  },
  {
    key: "ivr",
    kind: "acronym",
    matches: ["IVR"],
    definition: {
      hu: "interaktív hangválasz",
      en: "interactive voice response",
    },
  },
  {
    key: "b2b",
    kind: "acronym",
    matches: ["B2B"],
    definition: {
      hu: "vállalatközi",
      en: "business-to-business",
    },
  },
  {
    key: "llm",
    kind: "acronym",
    matches: ["LLM"],
    definition: {
      hu: "nagy nyelvi modell",
      en: "large language model",
    },
  },
  {
    key: "api",
    kind: "acronym",
    matches: ["API"],
    definition: {
      hu: "alkalmazásprogramozási felület",
      en: "application programming interface",
    },
  },
  {
    key: "nlp",
    kind: "acronym",
    matches: ["NLP"],
    definition: {
      hu: "természetesnyelv-feldolgozás",
      en: "natural language processing",
    },
  },
  {
    key: "poc",
    kind: "acronym",
    matches: ["POC"],
    definition: {
      hu: "koncepció igazolása",
      en: "proof of concept",
    },
  },
  {
    key: "kpi",
    kind: "acronym",
    matches: ["KPI"],
    definition: {
      hu: "kulcsfontosságú teljesítménymutató",
      en: "key performance indicator",
    },
  },
  {
    key: "seo",
    kind: "acronym",
    matches: ["SEO"],
    definition: {
      hu: "keresőoptimalizálás",
      en: "search engine optimization",
    },
  },
  {
    key: "gpt",
    kind: "acronym",
    matches: ["GPT"],
    definition: {
      hu: "generatív előre betanított transzformer",
      en: "generative pre-trained transformer",
    },
  },
  {
    key: "service-design",
    kind: "phrase",
    matches: ["service design"],
    definition: {
      hu: "szolgáltatástervezés",
      en: "service design methodology",
    },
  },
  {
    key: "design-system",
    kind: "phrase",
    matches: ["design system"],
    definition: {
      hu: "tervezési rendszer",
      en: "reusable design system",
    },
  },
  {
    key: "workshop",
    kind: "phrase",
    matches: ["workshop"],
    definition: {
      hu: "műhelymunka",
      en: "collaborative working session",
    },
  },
  {
    key: "wireframe",
    kind: "phrase",
    matches: ["wireframe"],
    definition: {
      hu: "drótváz",
      en: "visual interface outline",
    },
  },
  {
    key: "dashboard",
    kind: "phrase",
    matches: ["dashboard"],
    definition: {
      hu: "áttekintő vezérlőfelület",
      en: "overview control panel",
    },
  },
] as const;

type AcronymTerm = Extract<TerminologyTerm, { kind: "acronym" }>;

interface TermMatch {
  readonly term: TerminologyTerm;
  readonly value: string;
  readonly start: number;
  readonly end: number;
  readonly consumedEnd: number;
  readonly expansionAlreadyPresent: boolean;
}

interface ProtectedRange {
  readonly start: number;
  readonly end: number;
}

interface TextPart {
  readonly type: "text" | "term";
  readonly value: string;
  readonly suffix?: string;
  readonly term?: TerminologyTerm;
  readonly expansionAlreadyPresent?: boolean;
}

/*
 * JavaScript's `\b` is ASCII-oriented even with the Unicode flag. These
 * helpers make a boundary treat accented Hungarian letters, combining marks,
 * digits and underscores as word characters too.
 */
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}_]/u;

function isWordCharacter(value: string | undefined): boolean {
  return value !== undefined && WORD_CHARACTER.test(value);
}

function isBoundaryBefore(text: string, index: number): boolean {
  return !isWordCharacter(text[index - 1]);
}

/*
 * Hungarian suffixes are kept outside the English-language span. This allows
 * `UX-et`, `AI-ról`, `dashboardon` and similar text to retain natural visible
 * typography while still identifying the English base term. Hyphenated suffixes
 * already end at a normal punctuation boundary, so they need no special case.
 */
const SUFFIXES = [
  "jaitok",
  "jeitek",
  "jait",
  "jeit",
  "aitok",
  "eitek",
  "otok",
  "etek",
  "atok",
  "ötök",
  "ok",
  "ek",
  "ak",
  "ök",
  "ban",
  "ben",
  "ból",
  "ből",
  "ról",
  "ről",
  "tól",
  "től",
  "hoz",
  "hez",
  "höz",
  "eket",
  "nál",
  "nél",
  "nal",
  "nel",
  "val",
  "vel",
  "nak",
  "nek",
  "on",
  "en",
  "ön",
  "ra",
  "re",
  "ba",
  "be",
  "ig",
  "ért",
  "kor",
  "ként",
  "olni",
  "n",
  "et",
  "at",
  "ot",
  "öt",
  "t",
  "s",
].sort((a, b) => b.length - a.length);

function suffixesReachBoundary(
  text: string,
  start: number,
  depth = 0,
): boolean {
  if (!isWordCharacter(text[start])) return depth > 0;
  if (depth >= 3) return false;

  const remaining = text.slice(start).toLocaleLowerCase("hu-HU");
  for (const suffix of SUFFIXES) {
    if (
      remaining.startsWith(suffix) &&
      suffixesReachBoundary(text, start + suffix.length, depth + 1)
    ) {
      return true;
    }
  }
  return false;
}

function isBoundaryAfter(text: string, index: number): boolean {
  if (!isWordCharacter(text[index])) return true;
  return suffixesReachBoundary(text, index);
}

function suffixBoundaryEnd(
  text: string,
  start: number,
  depth = 0,
): number | undefined {
  if (!isWordCharacter(text[start])) return depth > 0 ? start : undefined;
  if (depth >= 3) return undefined;

  const remaining = text.slice(start).toLocaleLowerCase("hu-HU");
  for (const suffix of SUFFIXES) {
    if (remaining.startsWith(suffix)) {
      const end = suffixBoundaryEnd(text, start + suffix.length, depth + 1);
      if (end !== undefined) return end;
    }
  }
  return undefined;
}

/*
 * Keep a Hungarian suffix outside the English span and place a hidden
 * expansion after that suffix. This makes the spoken order natural for forms
 * such as "UX-et" while preserving the exact visible spelling.
 */
function consumedEndAfterSuffix(text: string, end: number): number {
  const directEnd = suffixBoundaryEnd(text, end);
  if (directEnd !== undefined) return directEnd;

  if (text[end] === "-" && isWordCharacter(text[end + 1])) {
    return suffixBoundaryEnd(text, end + 1) ?? end;
  }
  return end;
}

function isAcronymMatch(term: TerminologyTerm): boolean {
  return term.kind === "acronym";
}

function matchesAt(
  text: string,
  index: number,
  candidate: string,
  caseSensitive: boolean,
): boolean {
  const value = text.slice(index, index + candidate.length);
  return caseSensitive
    ? value === candidate
    : value.toLocaleLowerCase("en-US") === candidate.toLocaleLowerCase("en-US");
}

function escapedRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isKnownForeignBase(value: string): boolean {
  return TERMINOLOGY_GLOSSARY.some(
    (term) =>
      term.kind === "phrase" &&
      term.matches.some(
        (candidate) =>
          !candidate.includes(" ") &&
          candidate.toLocaleLowerCase("en-US") ===
            value.toLocaleLowerCase("en-US"),
      ),
  );
}

/*
 * A lower-case hyphenated token is normally a URL slug, but a known foreign
 * base followed by Hungarian prose is different. `wireframe-eket` is a
 * textual compound (and `eket` is an explicit suffix), whereas
 * `wireframe-tervezes` is indistinguishable from a bare ASCII slug. Accented
 * prose such as `wireframe-tervezés` is likewise safe to interpret as copy.
 */
function shouldProtectLowerHyphenatedToken(value: string): boolean {
  const separator = value.indexOf("-");
  if (separator < 1) return true;

  const base = value.slice(0, separator);
  if (!isKnownForeignBase(base)) return true;

  const remainder = value.slice(separator + 1);
  if (/[^\x00-\x7F]/u.test(remainder)) return false;

  return suffixBoundaryEnd(remainder, 0) !== remainder.length;
}

/**
 * Detect inline material that must not be interpreted as page copy.
 *
 * Markdown code nodes and link destinations are excluded by the AST visitor
 * below. This string-level protection covers TermText and attribute labels:
 * URLs, e-mail addresses, path-like slugs, backtick code, and common
 * filenames remain byte-for-byte unchanged.
 */
function protectedRanges(text: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];

  const addMatches = (expression: RegExp) => {
    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      const value = match[0];
      if (value) {
        ranges.push({
          start: match.index ?? 0,
          end: (match.index ?? 0) + value.length,
        });
      }
    }
  };

  addMatches(/`+[^`]*`+/g);
  addMatches(/\b(?:https?|ftp):\/\/[^\s<>"'`]+/giu);
  addMatches(/\bwww\.[^\s<>"'`]+/giu);
  addMatches(/\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}\b/gu);
  addMatches(
    /(?:^|(?<=[\s([{]))\/[\p{L}\p{N}._~%:@+-]+(?:\/[\p{L}\p{N}._~%:@+-]+)*/gu,
  );
  const relativePathExpression =
    /(?<![\p{L}\p{N}_])[\p{L}\p{N}._~%:@+-]+(?:\/[\p{L}\p{N}._~%:@+-]+)+/gu;
  for (const match of text.matchAll(relativePathExpression)) {
    // The glossary's combined acronym is intentionally written with a slash.
    // A standalone UX/UI is copy; a longer token such as UX/UI/page remains a
    // path and is protected.
    if (/^UX\/UI(?:[.,!?;:)\]}]|$)/u.test(match[0])) continue;
    ranges.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    });
  }
  addMatches(
    /\b[\p{L}\p{N}_-]+\.(?:png|jpe?g|gif|svg|webp|avif|pdf|docx?|xlsx?|tsx?|jsx?|html?|css|json|md|csv|zip)\b/giu,
  );

  // Preserve lower-case bare slugs, while allowing a known foreign base to
  // participate in a Hungarian compound or an explicitly listed suffix.
  const slugExpression =
    /(?<![\p{L}\p{N}_])[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+(?![\p{L}\p{N}_])/gu;
  for (const match of text.matchAll(slugExpression)) {
    const value = match[0];
    if (
      value &&
      value === value.toLocaleLowerCase("en-US") &&
      shouldProtectLowerHyphenatedToken(value)
    ) {
      ranges.push({
        start: match.index ?? 0,
        end: (match.index ?? 0) + value.length,
      });
    }
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  return ranges;
}

function rangeStartingAt(
  ranges: readonly ProtectedRange[],
  index: number,
): ProtectedRange | undefined {
  for (const range of ranges) {
    if (range.start > index) return undefined;
    if (index >= range.start && index < range.end) return range;
  }
  return undefined;
}

function expansionAlreadyPresentAt(
  text: string,
  end: number,
  definition: string | undefined,
): boolean {
  if (!definition) return false;
  const suffix = text.slice(end);
  const expression = new RegExp(
    `^\\s*(?:[([][^)\\]\\n]*${escapedRegExp(definition)}[^)\\]\\n]*[)\\]]|[=:—–-]\\s*${escapedRegExp(definition)}(?=$|[\\s.,;:!?)}\\]])|${escapedRegExp(definition)}(?=$|[\\s.,;:!?)}\\]]))`,
    "iu",
  );
  return expression.test(suffix);
}

function expansionAppearsInLabel(
  text: string,
  definition: string,
): boolean {
  const expression = new RegExp(
    `[([][^)\\]\\n]*${escapedRegExp(definition)}[^)\\]\\n]*[)\\]]|[=:—–-]\\s*${escapedRegExp(definition)}(?=$|[\\s.,;:!?)}\\]])`,
    "iu",
  );
  return expression.test(text);
}

function sortedCandidates(): Array<{
  readonly term: TerminologyTerm;
  readonly value: string;
}> {
  return TERMINOLOGY_GLOSSARY.flatMap((term) =>
    term.matches.map((value) => ({ term, value })),
  ).sort((a, b) => b.value.length - a.value.length);
}

const SORTED_CANDIDATES = sortedCandidates();

function findMatches(
  text: string,
  options: { readonly acronymsOnly?: boolean } = {},
): TermMatch[] {
  if (!text) return [];

  const ranges = protectedRanges(text);
  const matches: TermMatch[] = [];
  let index = 0;

  while (index < text.length) {
    const protectedRange = rangeStartingAt(ranges, index);
    if (protectedRange) {
      index = protectedRange.end;
      continue;
    }

    let found: TermMatch | undefined;
    for (const candidate of SORTED_CANDIDATES) {
      if (
        options.acronymsOnly &&
        !isAcronymMatch(candidate.term)
      ) {
        continue;
      }

      const caseSensitive = isAcronymMatch(candidate.term);
      if (
        !matchesAt(text, index, candidate.value, caseSensitive) ||
        !isBoundaryBefore(text, index) ||
        !isBoundaryAfter(text, index + candidate.value.length)
      ) {
        continue;
      }

      found = {
        term: candidate.term,
        value: text.slice(index, index + candidate.value.length),
        start: index,
        end: index + candidate.value.length,
        consumedEnd: consumedEndAfterSuffix(
          text,
          index + candidate.value.length,
        ),
        expansionAlreadyPresent: expansionAlreadyPresentAt(
          text,
          consumedEndAfterSuffix(text, index + candidate.value.length),
          candidate.term.definition?.hu,
        ),
      };
      break;
    }

    if (found) {
      matches.push(found);
      index = found.end;
    } else {
      index += 1;
    }
  }

  return matches;
}

function splitText(
  text: string,
  locale: TerminologyLocale,
): TextPart[] {
  const matches = findMatches(text);
  if (matches.length === 0) return [{ type: "text", value: text }];

  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      parts.push({ type: "text", value: text.slice(cursor, match.start) });
    }

    const definition = match.term.definition?.[locale];
    parts.push({
      type: "term",
      value: match.value,
      suffix: text.slice(match.end, match.consumedEnd),
      term: match.term,
      expansionAlreadyPresent:
        match.expansionAlreadyPresent ||
        (definition
          ? expansionAlreadyPresentAt(text, match.consumedEnd, definition)
          : false),
    });
    cursor = match.consumedEnd;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", value: text.slice(cursor) });
  }
  return parts;
}

/**
 * Returns an accessible name that starts with the exact original label.
 * Terminology definitions are appended as plain text because HTML is not valid
 * in attribute values. Repeated calls with the same locale are idempotent.
 */
export function accessibleTermLabel(
  text: string,
  locale: TerminologyLocale,
): string {
  if (!text) return text;

  const matches = findMatches(text);
  const seen = new Set<string>();
  const definitions: string[] = [];

  for (const match of matches) {
    const definition = match.term.definition?.[locale];
    if (!definition || seen.has(match.term.key)) continue;
    seen.add(match.term.key);

    if (!expansionAppearsInLabel(text, definition)) {
      definitions.push(definition);
    }
  }

  return definitions.length > 0
    ? `${text} (${definitions.join("; ")})`
    : text;
}

export interface TerminologyTextPart {
  readonly type: "text" | "term";
  readonly value: string;
  readonly suffix?: string;
  readonly termKey?: string;
  readonly definition?: string;
  readonly acronym?: boolean;
  readonly expansionAlreadyPresent?: boolean;
}

/**
 * Exposed as a small pure seam for tests and non-React renderers. Consumers
 * that need markup should prefer TermText or terminologyRemarkPlugin.
 */
export function splitTerminologyText(
  text: string,
  locale: TerminologyLocale,
): TerminologyTextPart[] {
  const sourceParts = splitText(text, locale);
  const seen = new Set<string>();

  return sourceParts.map((part) => {
    if (part.type === "text" || !part.term) {
      return { type: "text", value: part.value };
    }

    const definition = part.term.definition?.[locale];
    const expansionAlreadyPresent =
      Boolean(part.expansionAlreadyPresent) || seen.has(part.term.key);
    if (definition) seen.add(part.term.key);

    return {
      type: "term",
      value: part.value,
      suffix: part.suffix,
      termKey: part.term.key,
      definition,
      acronym: isAcronymMatch(part.term),
      expansionAlreadyPresent,
    };
  });
}

interface MarkdownNode {
  type?: string;
  value?: string;
  alt?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: Record<string, unknown>;
}

function mdastSpan(
  value: string,
  properties: Record<string, unknown>,
  termKey?: string,
): MarkdownNode {
  return {
    type: "terminology",
    children: [{ type: "text", value }],
    data: {
      hName: "span",
      hProperties: properties,
      terminologyTerm: termKey,
    },
  };
}

interface MarkdownTextLeaf {
  readonly node: MarkdownNode;
  readonly parent: MarkdownNode;
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly linkOwner?: MarkdownNode;
}

interface InlineCollection {
  source: string;
  readonly leaves: MarkdownTextLeaf[];
  readonly generatedTerms: Set<string>;
}

const INLINE_CONTAINERS = new Set([
  "paragraph",
  "heading",
  "link",
  "tableCell",
]);

function appendInlineBoundary(collection: InlineCollection): void {
  // A NUL cannot be part of a recognised term. It prevents a term from
  // accidentally spanning code, an image, or an already-generated wrapper.
  collection.source += "\u0000";
}

function collectInlineContent(
  node: MarkdownNode,
  parent: MarkdownNode | undefined,
  index: number,
  collection: InlineCollection,
  locale: TerminologyLocale,
  linkOwner?: MarkdownNode,
): void {
  if (node.type === "code" || node.type === "inlineCode") {
    appendInlineBoundary(collection);
    return;
  }

  if (node.type === "terminology") {
    const generatedTerm = node.data?.terminologyTerm;
    if (
      typeof generatedTerm === "string" &&
      !generatedTerm.endsWith(":expansion")
    ) {
      collection.generatedTerms.add(generatedTerm);
    }
    appendInlineBoundary(collection);
    return;
  }

  if (node.type === "image") {
    if (typeof node.alt === "string") {
      node.alt = accessibleTermLabel(node.alt, locale);
    }
    appendInlineBoundary(collection);
    return;
  }

  if (node.type === "break" || node.type === "html") {
    appendInlineBoundary(collection);
    return;
  }

  if (node.type === "text" && typeof node.value === "string") {
    const start = collection.source.length;
    collection.source += node.value;
    if (parent) {
      collection.leaves.push({
        node,
        parent,
        index,
        start,
        end: collection.source.length,
        linkOwner,
      });
    }
    return;
  }

  if (!Array.isArray(node.children)) return;

  const childLinkOwner = node.type === "link" ? node : linkOwner;
  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
    collectInlineContent(
      node.children[childIndex],
      node,
      childIndex,
      collection,
      locale,
      childLinkOwner,
    );
  }
}

function collectInlineContainer(
  container: MarkdownNode,
  locale: TerminologyLocale,
): InlineCollection {
  const collection: InlineCollection = {
    source: "",
    leaves: [],
    generatedTerms: new Set<string>(),
  };
  if (!Array.isArray(container.children)) return collection;

  for (let index = 0; index < container.children.length; index += 1) {
    collectInlineContent(
      container.children[index],
      container,
      index,
      collection,
      locale,
    );
  }
  return collection;
}

function ownerForMatch(
  match: TermMatch,
  collection: InlineCollection,
  container: MarkdownNode,
): MarkdownNode {
  const owners = new Set<MarkdownNode>();
  let hasUnownedLeaf = false;
  for (const leaf of [...collection.leaves].sort(
    (a, b) => b.index - a.index,
  )) {
    if (
      leaf.start < match.end &&
      leaf.end > match.start
    ) {
      if (leaf.linkOwner) owners.add(leaf.linkOwner);
      else hasUnownedLeaf = true;
    }
  }
  return !hasUnownedLeaf && owners.size === 1 ? [...owners][0] : container;
}

function replaceLeaf(
  leaf: MarkdownTextLeaf,
  matches: readonly TermMatch[],
): MarkdownNode[] {
  const text = leaf.node.value || "";
  const replacements: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.end <= leaf.start || match.start >= leaf.end) continue;

    const localStart = Math.max(0, match.start - leaf.start);
    const localEnd = Math.min(text.length, match.end - leaf.start);
    if (localEnd <= localStart) continue;

    if (localStart > cursor) {
      replacements.push({
        type: "text",
        value: text.slice(cursor, localStart),
      });
    }
    replacements.push(
      mdastSpan(
        text.slice(localStart, localEnd),
        { lang: "en" },
        match.term.key,
      ),
    );
    cursor = localEnd;
  }

  if (cursor === 0) return [leaf.node];
  if (cursor < text.length) {
    replacements.push({ type: "text", value: text.slice(cursor) });
  }
  return replacements;
}

function transformInlineContainer(
  container: MarkdownNode,
  locale: TerminologyLocale,
): void {
  if (!Array.isArray(container.children)) return;

  const collection = collectInlineContainer(container, locale);
  const matches = findMatches(collection.source);
  const seen = new Set(collection.generatedTerms);
  const definitionsByOwner = new Map<
    MarkdownNode,
    Array<{ key: string; definition: string }>
  >();

  for (const match of matches) {
    if (!isAcronymMatch(match.term) || !match.term.definition) continue;
    const definition = match.term.definition[locale];
    const alreadyExpanded =
      expansionAppearsInLabel(collection.source, definition) ||
      expansionAlreadyPresentAt(
        collection.source,
        match.consumedEnd,
        definition,
      );
    if (seen.has(match.term.key)) continue;

    seen.add(match.term.key);
    if (alreadyExpanded) continue;

    const owner = ownerForMatch(match, collection, container);
    const definitions = definitionsByOwner.get(owner) || [];
    definitions.push({ key: match.term.key, definition });
    definitionsByOwner.set(owner, definitions);
  }

  /*
   * Apply visible wrappers only after every match was found from the joined
   * inline source. This recognises formatted UX followed by /UI as UX/UI and
   * retains emphasis
   * by wrapping each affected leaf segment without moving it.
   */
  for (const leaf of [...collection.leaves].sort(
    (a, b) => b.index - a.index,
  )) {
    const replacements = replaceLeaf(leaf, matches);
    const children = leaf.parent.children;
    if (!children || children[leaf.index] !== leaf.node) continue;
    children.splice(leaf.index, 1, ...replacements);
  }

  // Definitions are an appendix, never interleaved with acronym tokens.
  for (const [owner, definitions] of definitionsByOwner) {
    if (!owner.children) continue;
    for (const { key, definition } of definitions) {
      owner.children.push(
        mdastSpan(
          ` (${definition})`,
          { className: "sr-only" },
          `${key}:expansion`,
        ),
      );
    }
  }
}

function transformMarkdownTree(
  node: MarkdownNode,
  locale: TerminologyLocale,
): void {
  if (node.type === "code" || node.type === "inlineCode") return;

  if (node.type === "image" && typeof node.alt === "string") {
    node.alt = accessibleTermLabel(node.alt, locale);
    return;
  }

  if (node.type && INLINE_CONTAINERS.has(node.type)) {
    transformInlineContainer(node, locale);
    return;
  }

  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    transformMarkdownTree(child, locale);
  }
}

/**
 * Remark plugin used by every Markdown renderer.
 *
 * The custom mdast nodes are converted by mdast-util-to-hast through `data`
 * into real `<span>` elements; no raw HTML nodes are introduced. Running the
 * transformer a second time skips those nodes, so processing is idempotent.
 */
export function terminologyRemarkPlugin(
  locale: TerminologyLocale,
): (
  tree?: MarkdownNode,
) => ((tree: MarkdownNode) => void) | void {
  const transform = (tree: MarkdownNode) => {
    transformMarkdownTree(tree, locale);
  };

  /*
   * A remark plugin is an attacher that returns a transformer. Supporting a
   * tree argument as well keeps this export convenient for small AST tests and
   * callers that already have a parsed tree.
   */
  return (tree?: MarkdownNode) => {
    if (tree && typeof tree.type === "string") {
      transform(tree);
      return;
    }
    return transform;
  };
}
