import assert from "node:assert/strict";
import { test } from "node:test";
import { trimContent } from "../src/lib/trim-content.js";
import { trimContentFields, registerContentTrimming } from "../../strapi/src/trim-content-fields.ts";

const components = {
  seo: { attributes: { metaTitle: { type: "string" }, metaDescription: { type: "text" }, ogImage: { type: "media" } } },
  card: { attributes: { title: { type: "string" }, body: { type: "richtext" }, image: { type: "media" } } },
};
const schema = { attributes: {
  title: { type: "string", required: true }, slug: { type: "uid" },
  seo: { type: "component", component: "seo" },
  cards: { type: "component", component: "card", repeatable: true },
  blocks: { type: "dynamiczone" }, related: { type: "relation" },
}};
test("CMS trims only supplied title/slug/SEO fields and preserves component identity/media", () => {
  const input = {
    title: "\t Cím  belső szóközzel \n", slug: " árvíz-tűrő\t",
    seo: { id: 7, metaTitle: "  SEO cím ", metaDescription: " Leírás. ", ogImage: { id: 8 } },
    cards: [{ id: 4, title: "  Card ", body: "  <p>keep</p> ", image: { id: 9 } }],
    blocks: [{ __component: "card", id: 10, title: "\n Heading ", body: " text " }],
    related: { connect: [{ name: " untouched " }] },
  };
  const result = trimContentFields(input, schema, components);
  assert.equal(result.title, "Cím  belső szóközzel");
  assert.equal(result.slug, "árvíz-tűrő");
  assert.equal(result.seo.metaDescription, "Leírás.");
  assert.deepEqual(result.seo.ogImage, { id: 8 });
  assert.equal(result.cards[0].id, 4);
  assert.equal(result.cards[0].body, input.cards[0].body);
  assert.equal(result.blocks[0].title, "Heading");
  assert.equal(result.related, input.related);
  assert.deepEqual(trimContentFields({ title: null }, schema, components), { title: null });
  assert.deepEqual(trimContentFields({ title: "  " }, schema, components), { title: "" });
  assert.deepEqual(trimContentFields({}, schema, components), {});
  assert.deepEqual(trimContentFields(result, schema, components), result);
  assert.notEqual(input.title, result.title);
});
test("middleware trims create/update before next, leaves other operations alone", async () => {
  let middleware;
  registerContentTrimming({ contentTypes: { "api::post.post": schema }, components,
    documents: { use(fn) { middleware = fn; } } });
  for (const action of ["create", "update", "findMany"]) {
    const ctx = { uid: "api::post.post", action, params: { locale: "en", data: { title: " Title " } } };
    await middleware(ctx, async () => {
      assert.equal(ctx.params.data.title, action === "findMany" ? " Title " : "Title");
      assert.equal(ctx.params.locale, "en");
    });
  }
});
test("frontend normalizes legacy HU/EN content, preserving rich text and nulls", () => {
  for (const title of ["  Magyar cím \n", "\t English title  "]) {
    const input = { title, seo: { metaTitle: title, metaDescription: " Description " },
      breadcrumbs: [{ name: title, path: "/unchanged" }], slug: " slug ",
      body: " <p> text </p> ", content: [{ title: " rich text unchanged " }], other: null };
    const result = trimContent(input);
    assert.equal(result.title, title.trim());
    assert.equal(result.breadcrumbs[0].name, title.trim());
    assert.equal(result.seo.metaDescription, "Description");
    assert.equal(result.slug, "slug");
    assert.equal(result.body, input.body);
    assert.equal(result.content, input.content);
    assert.equal(result.other, null);
    assert.deepEqual(trimContent(result), result);
  }
});
