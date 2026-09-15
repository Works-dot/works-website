import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  accessibleTermLabel,
  splitTerminologyText,
  TERMINOLOGY_GLOSSARY,
} from "../src/lib/terminology";

/*
 * This is intentionally a static-output test.  It does not start a server and
 * does not use a browser: every assertion below is made against the HTML that
 * the prerenderer wrote to dist/public.
 */

type Child = HtmlNode | string;

interface HtmlNode {
  readonly tag: string;
  readonly attrs: Record<string, string>;
  readonly parent: HtmlNode | undefined;
  readonly children: Child[];
}

interface TextLeaf {
  readonly value: string;
  readonly owner: HtmlNode;
}

interface FlatText {
  readonly original: string;
  readonly eligible: string;
  readonly owners: Array<HtmlNode | undefined>;
}

interface RequiredCandidate {
  readonly key: string;
  readonly label: string;
  readonly kind: "acronym" | "phrase";
  readonly expression: RegExp;
  readonly order: number;
}

interface RequiredOccurrence {
  readonly key: string;
  readonly label: string;
  readonly kind: RequiredCandidate["kind"];
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

interface CoreOccurrence {
  readonly key: string;
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

interface Page {
  readonly route: string;
  readonly file: string;
  readonly locale: "hu" | "en";
  readonly root: HtmlNode;
}

interface Failure {
  readonly kind: string;
  readonly route: string;
  readonly term: string;
  readonly detail: string;
  readonly context: string;
}

interface CorpusForm {
  readonly label: string;
  readonly expression: RegExp;
}

const CORPUS_FORMS: readonly CorpusForm[] = [
  { label: "wireframe-tervezés", expression: /wireframe-tervezés/giu },
  { label: "wireframe-eket", expression: /wireframe-eket/giu },
  { label: "service designnal", expression: /service designnal/giu },
  { label: "workshopolni", expression: /workshopolni/giu },
];

const REQUIRED_CANDIDATES: readonly RequiredCandidate[] = [
  {
    key: "ux-ui",
    label: "UX/UI",
    kind: "acronym",
    expression: /UX\s*\/\s*UI/gu,
    order: 0,
  },
  {
    key: "ux",
    label: "UX",
    kind: "acronym",
    expression: /UX/gu,
    order: 1,
  },
  {
    key: "ui",
    label: "UI",
    kind: "acronym",
    expression: /UI/gu,
    order: 2,
  },
  {
    key: "ai",
    label: "AI",
    kind: "acronym",
    expression: /AI/gu,
    order: 3,
  },
  {
    key: "service-design",
    label: "service design",
    kind: "phrase",
    expression: /service(?:[ \t]+|-)+design/giu,
    order: 4,
  },
  {
    key: "design-system",
    label: "design system",
    kind: "phrase",
    expression: /design(?:[ \t]+|-)system/giu,
    order: 5,
  },
  {
    key: "workshop",
    label: "workshop",
    kind: "phrase",
    expression: /workshop/giu,
    order: 6,
  },
  {
    key: "wireframe",
    label: "wireframe",
    kind: "phrase",
    expression: /wireframe/giu,
    order: 7,
  },
  {
    key: "dashboard",
    label: "dashboard",
    kind: "phrase",
    expression: /dashboard/giu,
    order: 8,
  },
];

const REQUIRED_BY_KEY = new Map(
  REQUIRED_CANDIDATES.map((candidate) => [candidate.key, candidate]),
);

/*
 * Keep this list deliberately explicit.  It is not intended to be a
 * Hungarian stemmer; it covers the inflections used by the content corpus
 * while making "service designer" and similarly different English words stay
 * out of the required service design term.
 */
const HUNGARIAN_SUFFIXES = [
  "jaitok",
  "jeitek",
  "jait",
  "jeit",
  "aitok",
  "eitek",
  "okkal",
  "ekkel",
  "akkal",
  "ökkel",
  "okon",
  "eken",
  "akon",
  "ökön",
  "olni",
  "olás",
  "olást",
  "olnak",
  "olható",
  "otok",
  "etek",
  "atok",
  "ötök",
  "okat",
  "eket",
  "akat",
  "öket",
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
  "ok",
  "ek",
  "ak",
  "ök",
  "et",
  "at",
  "ot",
  "öt",
  "n",
  "t",
  "s",
].sort((left, right) => right.length - left.length);

const WORD_CHARACTER = /[\p{L}\p{M}\p{N}_]/u;

const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "table",
  "td",
  "th",
  "tr",
  "ul",
]);

const SKIP_TAGS = new Set([
  "head",
  "meta",
  "link",
  "script",
  "style",
  "noscript",
  "template",
  "code",
  "pre",
  "option",
  "select",
  "textarea",
]);

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const HIDDEN_CLASS_NAMES = new Set([
  "invisible",
  "screen-reader-only",
  "sr-only",
  "visually-hidden",
]);

const RESPONSIVE_VISIBLE_CLASS = /^(?:sm|md|lg|xl|2xl):(?:block|flex|grid|inline|inline-block|inline-flex|table|visible)$/;

const STYLE_HIDDEN = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden)/iu;

/*
 * These ranges are also protected by terminology.ts.  Keeping a local copy
 * makes the corpus audit independent: a broken protection implementation
 * cannot make this test report a false pass.
 */
const PROTECTED_RANGES = [
  /\b(?:https?|ftp):\/\/[^\s<>"'`]+/giu,
  /\bwww\.[^\s<>"'`]+/giu,
  /\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}\b/gu,
  /(?:^|(?<=[\s([{]))\/[\p{L}\p{N}._~%:@+-]+(?:\/[\p{L}\p{N}._~%:@+-]+)*/gu,
];

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/giu, "\u00a0")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&apos;/giu, "'")
    .replace(/&#x([0-9a-f]+);/giu, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#([0-9]+);/gu, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    );
}

function findTagEnd(markup: string, start: number): number {
  let quote = "";
  for (let index = start; index < markup.length; index += 1) {
    const character = markup[index];
    if (quote) {
      if (character === quote) quote = "";
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return markup.length - 1;
}

function parseAttributes(source: string, tagEnd: number): {
  tag: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
} {
  const opening = source.match(/^<\s*([^\s/>]+)/u);
  if (!opening) {
    return { tag: "", attrs: {}, selfClosing: false };
  }

  const tag = opening[1].toLowerCase();
  const attrs: Record<string, string> = {};
  const attributeExpression =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu;
  attributeExpression.lastIndex = opening[0].length;
  const body = source.slice(0, tagEnd + 1);
  let match: RegExpExecArray | null;
  while ((match = attributeExpression.exec(body)) !== null) {
    const name = match[1].toLowerCase();
    if (name === tag) continue;
    attrs[name] = decodeHtmlEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }

  return {
    tag,
    attrs,
    selfClosing: /\/\s*>$/u.test(body),
  };
}

function parseHtml(markup: string): HtmlNode {
  const document: HtmlNode = {
    tag: "#document",
    attrs: {},
    parent: undefined,
    children: [],
  };
  const stack: HtmlNode[] = [document];
  let cursor = 0;

  const appendText = (value: string) => {
    if (value) stack[stack.length - 1].children.push(decodeHtmlEntities(value));
  };

  while (cursor < markup.length) {
    const openingIndex = markup.indexOf("<", cursor);
    if (openingIndex < 0) {
      appendText(markup.slice(cursor));
      break;
    }
    if (openingIndex > cursor) appendText(markup.slice(cursor, openingIndex));

    if (markup.startsWith("<!--", openingIndex)) {
      const commentEnd = markup.indexOf("-->", openingIndex + 4);
      cursor = commentEnd < 0 ? markup.length : commentEnd + 3;
      continue;
    }

    if (markup.startsWith("<![CDATA[", openingIndex)) {
      const cdataEnd = markup.indexOf("]]>", openingIndex + 9);
      cursor = cdataEnd < 0 ? markup.length : cdataEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(markup, openingIndex + 1);
    const source = markup.slice(openingIndex, tagEnd + 1);
    const closing = source.match(/^<\s*\/\s*([^\s>]+)/u);
    if (closing) {
      const tag = closing[1].toLowerCase();
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
      cursor = tagEnd + 1;
      continue;
    }

    if (/^<!/u.test(source) || /^<\?/u.test(source)) {
      cursor = tagEnd + 1;
      continue;
    }

    const parsed = parseAttributes(source, source.length - 1);
    if (!parsed.tag) {
      appendText("<");
      cursor = openingIndex + 1;
      continue;
    }

    const node: HtmlNode = {
      tag: parsed.tag,
      attrs: parsed.attrs,
      parent: stack[stack.length - 1],
      children: [],
    };
    stack[stack.length - 1].children.push(node);
    cursor = tagEnd + 1;

    if (VOID_TAGS.has(parsed.tag) || parsed.selfClosing) continue;
    stack.push(node);

    /*
     * Script/style JSON frequently contains '<' characters.  It is excluded
     * from the corpus anyway, so consume its raw body as one child and resume
     * at the matching closing tag instead of trying to parse that body.
     */
    if (SKIP_TAGS.has(parsed.tag)) {
      const closingExpression = new RegExp(
        `</\\s*${parsed.tag}\\s*>`,
        "giu",
      );
      closingExpression.lastIndex = cursor;
      const closingMatch = closingExpression.exec(markup);
      const bodyEnd = closingMatch?.index ?? markup.length;
      if (bodyEnd > cursor) node.children.push(markup.slice(cursor, bodyEnd));
      if (closingMatch) {
        cursor = closingMatch.index + closingMatch[0].length;
        stack.pop();
      } else {
        cursor = markup.length;
      }
    }
  }

  return document;
}

function findFirst(node: HtmlNode, tag: string): HtmlNode | undefined {
  if (node.tag === tag) return node;
  for (const child of node.children) {
    if (typeof child !== "string") {
      const found = findFirst(child, tag);
      if (found) return found;
    }
  }
  return undefined;
}

function isHidden(node: HtmlNode): boolean {
  const attrs = node.attrs;
  if ("hidden" in attrs || attrs["aria-hidden"]?.toLowerCase() === "true") {
    return true;
  }
  if (STYLE_HIDDEN.test(attrs.style ?? "")) return true;

  const classes = new Set((attrs.class ?? "").split(/\s+/u).filter(Boolean));
  if ([...classes].some((className) => HIDDEN_CLASS_NAMES.has(className))) {
    return true;
  }
  if (
    classes.has("hidden") &&
    ![...classes].some((className) =>
      RESPONSIVE_VISIBLE_CLASS.test(className),
    )
  ) {
    return true;
  }
  return false;
}

function collectVisibleLeaves(
  node: HtmlNode,
  leaves: TextLeaf[],
  images: HtmlNode[],
): void {
  if (SKIP_TAGS.has(node.tag) || isHidden(node)) return;
  if (node.tag === "img") {
    if (node.attrs.alt) images.push(node);
    return;
  }

  for (const child of node.children) {
    if (typeof child === "string") {
      if (child) leaves.push({ value: child, owner: node });
      continue;
    }
    collectVisibleLeaves(child, leaves, images);
    if (BLOCK_TAGS.has(child.tag)) {
      leaves.push({ value: "\n", owner: node });
    }
  }
}

function flattenLeaves(leaves: readonly TextLeaf[]): FlatText {
  let original = "";
  const owners: Array<HtmlNode | undefined> = [];
  for (const leaf of leaves) {
    original += leaf.value;
    for (let index = 0; index < leaf.value.length; index += 1) {
      owners.push(leaf.owner);
    }
  }

  const protectedRanges: Array<{ start: number; end: number }> = [];
  for (const expression of PROTECTED_RANGES) {
    expression.lastIndex = 0;
    for (const match of original.matchAll(expression)) {
      const start = match.index ?? 0;
      protectedRanges.push({ start, end: start + match[0].length });
    }
  }

  const eligibleCharacters = original.split("");
  for (const range of protectedRanges) {
    for (
      let index = range.start;
      index < range.end && index < eligibleCharacters.length;
      index += 1
    ) {
      eligibleCharacters[index] = "\u0000";
    }
  }

  return { original, eligible: eligibleCharacters.join(""), owners };
}

function isWordCharacter(value: string | undefined): boolean {
  return value !== undefined && WORD_CHARACTER.test(value);
}

function isBoundaryBefore(text: string, index: number): boolean {
  return !isWordCharacter(text[index - 1]);
}

function suffixesReachBoundary(
  text: string,
  start: number,
  depth = 0,
): boolean {
  if (!isWordCharacter(text[start])) return depth > 0;
  if (depth >= 4) return false;

  const remaining = text.slice(start).toLocaleLowerCase("hu-HU");
  for (const suffix of HUNGARIAN_SUFFIXES) {
    if (
      remaining.startsWith(suffix) &&
      suffixesReachBoundary(text, start + suffix.length, depth + 1)
    ) {
      return true;
    }
  }
  return false;
}

function isBoundaryAfter(
  text: string,
  index: number,
  kind: RequiredCandidate["kind"],
): boolean {
  if (!isWordCharacter(text[index])) return true;
  return kind === "phrase" && suffixesReachBoundary(text, index);
}

function findRequiredOccurrences(text: string): RequiredOccurrence[] {
  const found: Array<RequiredOccurrence & { order: number }> = [];
  for (const candidate of REQUIRED_CANDIDATES) {
    candidate.expression.lastIndex = 0;
    for (const match of text.matchAll(candidate.expression)) {
      const start = match.index ?? 0;
      const value = match[0];
      const end = start + value.length;
      if (
        (candidate.key !== "ux-ui" && !isBoundaryBefore(text, start)) ||
        !isBoundaryAfter(text, end, candidate.kind)
      ) {
        continue;
      }
      found.push({
        key: candidate.key,
        label: candidate.label,
        kind: candidate.kind,
        start,
        end,
        value,
        order: candidate.order,
      });
    }
  }

  /*
   * The longest/most-specific candidate wins.  This prevents UX/UI from
   * becoming two occurrences (UX + UI), while retaining adjacent terms such
   * as "UX and UI".
   */
  found.sort(
    (left, right) =>
      left.start - right.start ||
      right.end - right.start - (left.end - left.start) ||
      left.order - right.order,
  );
  const selected: RequiredOccurrence[] = [];
  for (const occurrence of found) {
    if (
      selected.some(
        (existing) =>
          occurrence.start < existing.end && occurrence.end > existing.start,
      )
    ) {
      continue;
    }
    selected.push(occurrence);
  }
  return selected.sort((left, right) => left.start - right.start);
}

function termSampleEnd(text: string, end: number): number {
  let cursor = end;
  if (text[cursor] === "-") {
    cursor += 1;
    while (isWordCharacter(text[cursor])) cursor += 1;
    return cursor;
  }
  while (isWordCharacter(text[cursor])) cursor += 1;
  return cursor;
}

function splitCoreOccurrences(
  text: string,
  locale: "hu" | "en",
): CoreOccurrence[] {
  const parts = splitTerminologyText(text, locale);
  const occurrences: CoreOccurrence[] = [];
  let cursor = 0;

  for (const part of parts) {
    if (part.type === "term" && part.termKey) {
      const end = cursor + part.value.length;
      occurrences.push({
        key: part.termKey,
        start: cursor,
        end,
        value: part.value,
      });
      cursor = end + (part.suffix?.length ?? 0);
    } else {
      cursor += part.value.length;
    }
  }
  return occurrences;
}

function coreRecognizesOccurrence(
  text: string,
  occurrence: RequiredOccurrence,
  locale: "hu" | "en",
): boolean {
  /*
   * A rendered card can put adjacent labels next to one another without a
   * whitespace text node (for example "UX ResearchUX/UI Design").  Compare
   * the canonical splitter with the isolated occurrence plus its suffix,
   * rather than allowing that neighbouring label to change the boundary test.
   * The full corpus still supplies the independent boundary and lang checks.
   */
  const sampleEnd = termSampleEnd(text, occurrence.end);
  const sample = text.slice(occurrence.start, sampleEnd);
  return splitCoreOccurrences(sample, locale).some(
    (coreOccurrence) =>
      coreOccurrence.key === occurrence.key &&
      coreOccurrence.start === 0 &&
      coreOccurrence.end === occurrence.value.length,
  );
}

function hasEnglishAncestor(node: HtmlNode | undefined): boolean {
  let current = node;
  while (current) {
    const lang = current.attrs.lang?.toLowerCase();
    /*
     * The document-level html[lang=en] describes the page, but must not make
     * an unmarked term pass this audit.  A term needs an explicit language
     * ancestor in its rendered content (normally the generated span).
     */
    if (
      current.tag !== "html" &&
      (lang === "en" || lang?.startsWith("en-"))
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function contextFor(
  text: string,
  start: number,
  end: number,
  radius = 80,
): string {
  const left = Math.max(0, start - radius);
  const right = Math.min(text.length, end + radius);
  let context = normalizeWhitespace(text.slice(left, right));
  if (left > 0) context = `… ${context}`;
  if (right < text.length) context += " …";
  return context.replace(/\u0000/gu, "[excluded]");
}

function routeForFile(root: string, file: string): string {
  const relativeFile = relative(root, file).replaceAll("\\", "/");
  if (relativeFile === "index.html") return "/";
  if (relativeFile.endsWith("/index.html")) {
    return `/${relativeFile.slice(0, -"/index.html".length)}`;
  }
  return `/${relativeFile.replace(/\.html$/u, "")}`;
}

function findHtmlFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const file = resolve(directory, entry);
      if (statSync(file).isDirectory()) visit(file);
      else if (entry.endsWith(".html")) files.push(file);
    }
  };
  visit(root);
  return files.sort();
}

function glossaryTerm(key: string) {
  return TERMINOLOGY_GLOSSARY.find((term) => term.key === key);
}

function isInsideRenderedDefinition(
  text: string,
  start: number,
  locale: "hu" | "en",
): boolean {
  /*
   * Phrase definitions can themselves contain a required phrase, for example
   * "service design (service design methodology)".  The second match is the
   * generated definition, not a second image label to audit.
   */
  let opening = text.lastIndexOf("(", start);
  while (opening >= 0) {
    const closing = text.indexOf(")", opening + 1);
    if (closing >= start) {
      const parenthetical = text.slice(opening + 1, closing);
      if (
        TERMINOLOGY_GLOSSARY.some((term) =>
          term.definition?.[locale] &&
          parenthetical
            .toLocaleLowerCase(locale)
            .includes(term.definition[locale].toLocaleLowerCase(locale)),
        )
      ) {
        return true;
      }
    }
    opening = text.lastIndexOf("(", opening - 1);
  }
  return false;
}

function reportFailure(
  failures: Failure[],
  failure: Failure,
): void {
  failures.push(failure);
}

function getRootArgument(): string {
  const rootFlag = process.argv.indexOf("--root");
  if (rootFlag >= 0 && process.argv[rootFlag + 1]) {
    return resolve(process.argv[rootFlag + 1]);
  }
  const positional = process.argv.slice(2).find((argument) => !argument.startsWith("-"));
  return resolve(
    positional ??
      resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "public"),
  );
}

function main(): void {
  const root = getRootArgument();
  const files = findHtmlFiles(root);
  if (files.length === 0) {
    throw new Error(`No prerendered HTML files found under ${root}`);
  }

  const failures: Failure[] = [];
  const pages: Page[] = [];
  const counts = new Map<
    string,
    { occurrences: number; routes: Set<string>; locales: Set<string> }
  >();
  let imageTermValues = 0;
  let imageAcronymValues = 0;
  let imagePhraseValues = 0;
  const corpusFormCounts = new Map<
    string,
    { occurrences: number; routes: Set<string> }
  >();

  for (const file of files) {
    const rootNode = parseHtml(readFileSync(file, "utf8"));
    const html = findFirst(rootNode, "html");
    const htmlLang = html?.attrs.lang?.toLowerCase();
    const route = routeForFile(root, file);
    const locale: "hu" | "en" =
      route === "/en" || route.startsWith("/en/")
        ? "en"
        : htmlLang === "en"
          ? "en"
          : "hu";

    if (!html || (htmlLang !== "hu" && htmlLang !== "en")) {
      reportFailure(failures, {
        kind: "page-language",
        route,
        term: "page",
        detail: `expected html lang="hu" or lang="en", got ${htmlLang ?? "missing"}`,
        context: file,
      });
    }

    const leaves: TextLeaf[] = [];
    const images: HtmlNode[] = [];
    collectVisibleLeaves(rootNode, leaves, images);
    const flat = flattenLeaves(leaves);
    const expected = findRequiredOccurrences(flat.eligible);
    for (const form of CORPUS_FORMS) {
      form.expression.lastIndex = 0;
      for (const match of flat.eligible.matchAll(form.expression)) {
        const summary = corpusFormCounts.get(form.label) ?? {
          occurrences: 0,
          routes: new Set<string>(),
        };
        summary.occurrences += 1;
        summary.routes.add(route);
        corpusFormCounts.set(form.label, summary);
        void match;
      }
    }

    for (const occurrence of expected) {
      const candidate = REQUIRED_BY_KEY.get(occurrence.key);
      if (!candidate) continue;
      const summary = counts.get(occurrence.key) ?? {
        occurrences: 0,
        routes: new Set<string>(),
        locales: new Set<string>(),
      };
      summary.occurrences += 1;
      summary.routes.add(route);
      summary.locales.add(locale);
      counts.set(occurrence.key, summary);

      const owners = flat.owners.slice(occurrence.start, occurrence.end);
      if (
        owners.length !== occurrence.end - occurrence.start ||
        owners.some((owner) => !hasEnglishAncestor(owner))
      ) {
        reportFailure(failures, {
          kind: "unwrapped",
          route,
          term: occurrence.label,
          detail: "every character of the occurrence must have a lang=en ancestor",
          context: contextFor(flat.original, occurrence.start, occurrence.end),
        });
      }

      if (!coreRecognizesOccurrence(flat.eligible, occurrence, locale)) {
        reportFailure(failures, {
          kind: "core-miss",
          route,
          term: occurrence.label,
          detail: `splitTerminologyText did not return ${occurrence.value}`,
          context: contextFor(flat.original, occurrence.start, occurrence.end),
        });
      }
    }

    for (const image of images) {
      const alt = image.attrs.alt;
      if (!alt) continue;
      const altEligible = flattenLeaves([
        { value: alt, owner: image },
      ]).eligible;
      const imageOccurrences = findRequiredOccurrences(altEligible).filter(
        (occurrence) =>
          !isInsideRenderedDefinition(alt, occurrence.start, locale),
      );
      if (imageOccurrences.length === 0) continue;

      imageTermValues += 1;
      if (imageOccurrences.some((occurrence) => occurrence.kind === "acronym")) {
        imageAcronymValues += 1;
      }
      if (imageOccurrences.some((occurrence) => occurrence.kind === "phrase")) {
        imagePhraseValues += 1;
      }

      const labelled = accessibleTermLabel(alt, locale);
      if (labelled !== alt || /<[^>]+>/u.test(labelled)) {
        reportFailure(failures, {
          kind: "image-label",
          route,
          term: "image alt",
          detail:
            "rendered image alt must equal the canonical plain accessible label",
          context: alt,
        });
      }
      if (accessibleTermLabel(labelled, locale) !== labelled) {
        reportFailure(failures, {
          kind: "image-label",
          route,
          term: "image alt",
          detail: "accessibleTermLabel must be idempotent for rendered alt text",
          context: alt,
        });
      }

      for (const occurrence of imageOccurrences) {
        const term = glossaryTerm(occurrence.key);
        const definition = term?.definition?.[locale];
        if (!definition) {
          reportFailure(failures, {
            kind: "image-definition",
            route,
            term: occurrence.label,
            detail: "required image term has no localized glossary definition",
            context: alt,
          });
          continue;
        }
        const appearsInOriginal = alt
          .slice(occurrence.end)
          .toLocaleLowerCase(locale)
          .includes(definition.toLocaleLowerCase(locale));
        if (!appearsInOriginal) {
          reportFailure(failures, {
            kind: "image-definition",
            route,
            term: occurrence.label,
            detail: `image alt is missing the ${locale} definition "${definition}"`,
            context: alt,
          });
        }
      }

      for (const occurrence of imageOccurrences) {
        if (!coreRecognizesOccurrence(altEligible, occurrence, locale)) {
          reportFailure(failures, {
            kind: "image-core-miss",
            route,
            term: occurrence.label,
            detail: `splitTerminologyText did not recognize the image alt occurrence`,
            context: alt,
          });
        }
      }
    }

    pages.push({ route, file, locale, root: rootNode });
  }

  const missingCoverage: string[] = [];
  for (const candidate of REQUIRED_CANDIDATES) {
    const summary = counts.get(candidate.key);
    if (!summary || summary.occurrences === 0) {
      missingCoverage.push(`${candidate.label}: no eligible occurrences`);
      continue;
    }
    for (const locale of ["hu", "en"] as const) {
      if (!summary.locales.has(locale)) {
        missingCoverage.push(`${candidate.label}: no ${locale} occurrence`);
      }
    }
  }
  for (const missing of missingCoverage) {
    reportFailure(failures, {
      kind: "coverage",
      route: "(corpus)",
      term: "required term",
      detail: missing,
      context: "required terminology corpus",
    });
  }
  for (const form of CORPUS_FORMS) {
    const summary = corpusFormCounts.get(form.label);
    if (!summary || summary.occurrences === 0) {
      reportFailure(failures, {
        kind: "corpus-form",
        route: "(corpus)",
        term: form.label,
        detail: "named HU inflected/hyphenated regression form was not found",
        context: "required terminology corpus",
      });
    }
  }

  const summaryText = REQUIRED_CANDIDATES.map((candidate) => {
    const summary = counts.get(candidate.key);
    return `${candidate.label}=${summary?.occurrences ?? 0}/${summary?.routes.size ?? 0} routes`;
  }).join(", ");
  const formSummaryText = CORPUS_FORMS.map((form) => {
    const summary = corpusFormCounts.get(form.label);
    return `${form.label}=${summary?.occurrences ?? 0}/${summary?.routes.size ?? 0} routes`;
  }).join(", ");

  if (failures.length > 0) {
    const byKind = new Map<string, number>();
    for (const failure of failures) {
      byKind.set(failure.kind, (byKind.get(failure.kind) ?? 0) + 1);
    }
    const countsText = [...byKind.entries()]
      .map(([kind, count]) => `${kind}=${count}`)
      .join(", ");
    console.error(
      `FAIL: terminology corpus (${pages.length} HTML pages): ${countsText}`,
    );
    console.error(`Corpus: ${summaryText}`);
    console.error(`Named corpus forms: ${formSummaryText}`);
    console.error(
      `Meaningful image alts: ${imageTermValues} values ` +
        `(${imageAcronymValues} acronym, ${imagePhraseValues} phrase).`,
    );
    console.error("First 20 misses (remaining content forms):");
    for (const failure of failures.slice(0, 20)) {
      console.error(
        `- [${failure.kind}] ${failure.route} ${failure.term}: ` +
          `${failure.detail}; ${failure.context}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`PASS: terminology corpus (${pages.length} HTML pages).`);
  console.log(`Corpus: ${summaryText}`);
  console.log(`Named corpus forms: ${formSummaryText}`);
  console.log(
    `Meaningful image alts: ${imageTermValues} values ` +
      `(${imageAcronymValues} acronym, ${imagePhraseValues} phrase), ` +
      "with plain, localized and idempotent accessible labels.",
  );
}

main();