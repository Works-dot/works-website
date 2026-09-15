import assert from "node:assert/strict";
import { test } from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import {
  accessibleTermLabel,
  terminologyRemarkPlugin,
  type TerminologyLocale,
} from "./terminology";
import { TermText } from "../components/Terminology";

function renderTermText(text: string, locale: TerminologyLocale): string {
  return renderToStaticMarkup(
    createElement(TermText, { children: text, locale }),
  );
}

function renderMarkdown(text: string, locale: TerminologyLocale): string {
  return renderToStaticMarkup(
    createElement(ReactMarkdown, {
      remarkPlugins: [terminologyRemarkPlugin(locale)],
      children: text,
    }),
  );
}

test("accessibleTermLabel preserves labels, localizes acronym definitions, and is idempotent", () => {
  const hu = accessibleTermLabel("Open UX/UI and AI", "hu");
  assert.equal(
    hu,
    "Open UX/UI and AI (felhasználói élmény és felhasználói felület; mesterséges intelligencia)",
  );
  assert.equal(accessibleTermLabel(hu, "hu"), hu);

  const en = accessibleTermLabel("UX/UI", "en");
  assert.equal(en, "UX/UI (user experience and user interface)");
  assert.equal(accessibleTermLabel(en, "en"), en);

  assert.equal(accessibleTermLabel("", "hu"), "");
  assert.equal(accessibleTermLabel("Decorative image", "hu"), "Decorative image");
});

test("acronym case and Unicode boundaries avoid near-word false positives", () => {
  assert.equal(accessibleTermLabel("mai, aikido, UX-et, AI-ról", "hu"),
    "mai, aikido, UX-et, AI-ról (felhasználói élmény; mesterséges intelligencia)");
  assert.equal(accessibleTermLabel("UXperience and UXR", "hu"), "UXperience and UXR");
  assert.equal(accessibleTermLabel("áAI and xUI", "hu"), "áAI and xUI");
});

test("the reviewed acronym inventory has localized definitions", () => {
  const label = accessibleTermLabel(
    "WCAG CX IVR B2B LLM API NLP POC KPI SEO GPT gpt",
    "hu",
  );
  for (const definition of [
    "webtartalom-akadálymentesítési irányelvek",
    "ügyfélélmény",
    "interaktív hangválasz",
    "vállalatközi",
    "nagy nyelvi modell",
    "alkalmazásprogramozási felület",
    "természetesnyelv-feldolgozás",
    "koncepció igazolása",
    "kulcsfontosságú teljesítménymutató",
    "keresőoptimalizálás",
    "generatív előre betanított transzformer",
  ]) {
    assert.match(label, new RegExp(definition));
  }
  assert.equal(accessibleTermLabel("gpt", "hu"), "gpt");
});

test("URLs, slugs, e-mail addresses, filenames and code stay untouched", () => {
  const value =
    "https://example.test/UX, /en/services/ux-design, ux-ui-guide, " +
    "team@example.test, hero-dashboard.png, `UX AI`";
  assert.equal(accessibleTermLabel(value, "hu"), value);
});

test("Hungarian compounds recognize known foreign bases without matching longer words", () => {
  const html = renderTermText(
    "wireframe-tervezés, wireframe-eket, service designnal, workshopolni",
    "hu",
  );
  assert.match(html, /<span lang="en">wireframe<\/span>-tervezés/);
  assert.match(html, /<span lang="en">wireframe<\/span>-eket/);
  assert.match(html, /<span lang="en">service design<\/span>nal/);
  assert.match(html, /<span lang="en">workshop<\/span>olni/);

  const falsePositives = renderTermText(
    "workshopping wireframeless workshopolnic",
    "hu",
  );
  assert.equal(falsePositives, "workshopping wireframeless workshopolnic");
});

test("plain-text labels define phrases and retain bare ASCII slugs and paths", () => {
  const original =
    "wireframe-tervezés, wireframe-eket, service designnal, workshopolni, " +
    "design system, dashboard";
  const label = accessibleTermLabel(original, "hu");
  assert.ok(label.startsWith(`${original} (`));
  for (const definition of [
    "drótváz",
    "szolgáltatástervezés",
    "műhelymunka",
    "tervezési rendszer",
    "áttekintő vezérlőfelület",
  ]) {
    assert.match(label, new RegExp(definition));
  }
  assert.equal(accessibleTermLabel(label, "hu"), label);

  assert.equal(
    accessibleTermLabel("wireframe-tervezes", "hu"),
    "wireframe-tervezes",
  );
  assert.equal(
    accessibleTermLabel("assets/wireframe-eket/page", "hu"),
    "assets/wireframe-eket/page",
  );
});

test("suffixes leave the suffix outside the English-language term", () => {
  const html = renderTermText("UX-et dashboardon service designban", "hu");
  assert.match(html, /<span lang="en">UX<\/span>-et/);
  assert.match(html, /<span lang="en">dashboard<\/span>on/);
  assert.match(html, /<span lang="en">service design<\/span>ban/);
  assert.equal((html.match(/felhasználói élmény/g) ?? []).length, 1);
});

test("TermText preserves visible acronyms and emits one expansion per term call", () => {
  const html = renderTermText("UX and UX/UI and UX and AI", "en");
  assert.match(html, /<span lang="en">UX<\/span>/);
  assert.match(html, /<span lang="en">UX\/UI<\/span>/);
  assert.equal((html.match(/user experience/g) ?? []).length, 2);
  assert.equal((html.match(/user interface/g) ?? []).length, 1);
  assert.equal((html.match(/>UX<\/span>/g) ?? []).length, 2);
});

test("remark transformation keeps emphasis, links and code safe", () => {
  const html = renderMarkdown(
    "**UX** and [AI](https://example.test/AI) and `UI` plus *service design*",
    "hu",
  );
  assert.match(html, /<strong><span lang="en">UX<\/span>/);
  assert.match(html, /<a href="https:\/\/example\.test\/AI"><span lang="en">AI<\/span>/);
  assert.match(html, /<code>UI<\/code>/);
  assert.match(html, /<em><span lang="en">service design<\/span><\/em>/);
  assert.equal((html.match(/mesterséges intelligencia/g) ?? []).length, 1);
});

test("remark joins formatted siblings for longest matches and appends definitions", () => {
  const html = renderMarkdown("**UX**/UI and **UX**-et", "hu");
  const visibleEnd = html.indexOf(" and ");
  const firstDefinition = html.indexOf("felhasználói élmény és felhasználói felület");
  assert.ok(visibleEnd > 0);
  assert.ok(firstDefinition > visibleEnd);
  assert.match(html, /<strong><span lang="en">UX<\/span><\/strong><span lang="en">\/UI<\/span>/);
  assert.match(html, /<strong><span lang="en">UX<\/span><\/strong>-et/);
  assert.equal(
    (html.match(/felhasználói élmény és felhasználói felület/g) ?? []).length,
    1,
  );
  assert.equal((html.match(/felhasználói élmény\)/g) ?? []).length, 1);
});

test("formatted existing definitions suppress a duplicate appendix", () => {
  const html = renderMarkdown("**UX** *(felhasználói élmény)*", "hu");
  assert.match(html, /<strong><span lang="en">UX<\/span><\/strong>/);
  assert.match(html, /<em>\(felhasználói élmény\)<\/em>/);
  assert.equal((html.match(/class="sr-only"/g) ?? []).length, 0);
});

test("link definitions stay inside the link and Markdown image alt is labelled", () => {
  const link = renderMarkdown("[**UX**/UI](https://example.test/UX)", "hu");
  const linkStart = link.indexOf("<a ");
  const linkEnd = link.indexOf("</a>");
  const definition = link.indexOf("felhasználói élmény és felhasználói felület");
  assert.ok(linkStart >= 0 && definition > linkStart && definition < linkEnd);
  assert.match(
    link,
    /<a href="https:\/\/example\.test\/UX"><strong><span lang="en">UX<\/span><\/strong><span lang="en">\/UI<\/span><span class="sr-only">/,
  );

  const image = renderMarkdown("![UX](image.png)", "hu");
  assert.match(image, /alt="UX \(felhasználói élmény\)"/);
  assert.doesNotMatch(image, /lang="en"/);
});

test("remark plugin is idempotent and does not mutate existing generated nodes", () => {
  const tree: any = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "UX UX" }],
      },
    ],
  };
  const plugin = terminologyRemarkPlugin("hu");
  plugin(tree);
  const first = JSON.stringify(tree);
  plugin(tree);
  assert.equal(JSON.stringify(tree), first);
  assert.equal(
    tree.children[0].children.filter(
      (node: any) => node.data?.hProperties?.className === "sr-only",
    ).length,
    1,
  );
});
