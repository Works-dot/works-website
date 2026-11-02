import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { abbreviationRemarkPlugin } from "./abbreviations";
import { terminologyRemarkPlugin } from "./terminology";
const { abbreviationReplacement, abbreviationSelection } = createRequire(import.meta.url)("../../../strapi/src/admin/components/abbreviation-edit.ts");

function render(text: string, locale: "hu" | "en" = "hu") {
  return renderToStaticMarkup(createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, abbreviationRemarkPlugin, terminologyRemarkPlugin(locale)],
    children: text,
  }));
}

for (const locale of ["hu", "en"] as const) {
  test(`${locale}: explicit abbreviations survive SSR without glossary duplication`, () => {
    const html = render('<abbr title="Web Content Accessibility Guidelines">WCAG</abbr> és <abbr title="Saját feloldás">UX</abbr>.', locale);
    assert.match(html, /<abbr title="Web Content Accessibility Guidelines">WCAG<\/abbr>/);
    assert.match(html, /<abbr title="Saját feloldás">UX<\/abbr>/);
    assert.doesNotMatch(html, /sr-only|lang=/);
  });
}

test("formatting, links, surrounding glossary and code are preserved", () => {
  const html = render('**<abbr title="Saját élmény">UX</abbr>** [<abbr title="Adatvédelem">GDPR</abbr>](https://example.com) és UI.\n\n`<abbr title="nem">UX</abbr>`');
  assert.match(html, /<strong><abbr title="Saját élmény">UX<\/abbr><\/strong>/);
  assert.match(html, /<a href="https:\/\/example.com"><abbr title="Adatvédelem">GDPR<\/abbr><\/a>/);
  assert.match(html, /felhasználói felület/);
  assert.match(html, /<code>&lt;abbr/);
});

test("only the exact safe tag is interpreted, not scripts or event handlers", () => {
  for (const input of [
    '<abbr title="ok" onclick="alert(1)">UX</abbr>',
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<abbr title="ok"><img src=x onerror=alert(1)></abbr>',
    '<abbr title="ok"><svg onload=alert(1)></svg></abbr>',
    '<abbr title="unfinished">UX',
  ]) {
    const html = render(input);
    assert.doesNotMatch(html, /<(abbr|script|img|svg)\b/);
  }
  assert.match(render('<abbr title="&quot; onmouseover=&quot;alert(1)">X</abbr>'), /title="&quot; onmouseover=&quot;alert\(1\)"/);
});

test("editor insertion, reopen, update and removal keep surrounding Markdown", () => {
  const source = "Előtte **WCAG** utána.";
  const from = source.indexOf("WCAG");
  const selection = abbreviationSelection(source, from, from + 4);
  const encoded = abbreviationReplacement(selection, 'Irányelv "idézet" & egyéb');
  const saved = source.slice(0, from) + encoded + source.slice(from + 4);
  const reopened = abbreviationSelection(saved, from + encoded.indexOf(">") + 2, from + encoded.indexOf(">") + 2);
  assert.equal(reopened.existing, true);
  assert.equal(reopened.text, "WCAG");
  assert.equal(reopened.title, 'Irányelv "idézet" & egyéb');
  assert.match(render(saved), /<strong><abbr title="Irányelv &quot;idézet&quot; &amp; egyéb">WCAG<\/abbr><\/strong>/);
  assert.equal(abbreviationReplacement(reopened, "Updated"), '<abbr title="Updated">WCAG</abbr>');
  assert.equal(saved.slice(0, reopened.from) + abbreviationReplacement(reopened, "", true) + saved.slice(reopened.to), source);
  assert.throws(() => abbreviationReplacement(selection, " "));
});

test("numeric title entities and multiline paragraphs work without raw HTML support", () => {
  assert.match(render('Egy <abbr title="&#x151; &#34; &amp;">X</abbr>\nmásodik sor.'), /<abbr title="ő &quot; &amp;">X<\/abbr>/);
  assert.match(render('- <abbr title="Első">X</abbr>\n- <abbr title="Második">Y</abbr>'), /<li><abbr title="Második">Y<\/abbr><\/li>/);
});
