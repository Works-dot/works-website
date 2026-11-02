import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeHeadings } from "../src/editorial/headings";
import { normalizeEditorialContent } from "../src/editorial/content";
import { validateImageInfo, extendUploadWithEditorialRules } from "../src/editorial/media";

test("headings normalize without rewriting surrounding Markdown or code", () => {
  const input = '# Cím\n\n## \n\nTéma\n====\n\n<h1>HTML <abbr title="Meaning">X</abbr></h1>\n<h2> <em> </em></h2>\n\n```\n# code\n```\n\n`# inline`\n';
  const result = normalizeHeadings(input);
  assert.match(result, /^## Cím/);
  assert.doesNotMatch(result, /^## \s*$/m);
  assert.match(result, /Téma\n---/);
  assert.match(result, /<h2>HTML <abbr title="Meaning">X<\/abbr><\/h2>/);
  assert.doesNotMatch(result, /<em>/);
  assert.match(result, /```\n# code\n```/);
  assert.match(result, /`# inline`/);
  assert.equal(normalizeHeadings(result), result);
  assert.equal(normalizeHeadings("## `***`\n"), "## `***`\n");
  assert.equal(normalizeHeadings("## ![](image.png)\n"), "## ![](image.png)\n");
  assert.equal(normalizeHeadings("<h2><svg></svg></h2>\n"), "<h2><svg></svg></h2>\n");
});
test("partial component updates preserve IDs and enforce description boundaries", () => {
  const schema = { attributes: { seo: {type:"component",component:"seo"} } };
  const components = {seo:{attributes:{metaDescription:{type:"text"}}}};
  for (const s of ["á".repeat(160), "😀".repeat(80)]) {
    assert.equal(normalizeEditorialContent({seo:{id:8,metaDescription:s}},schema,components).seo.id,8);
  }
  assert.throws(()=>normalizeEditorialContent({seo:{metaDescription:"x".repeat(161)}},schema,components));
  assert.throws(()=>normalizeEditorialContent({seo:{metaDescription:"😀".repeat(81)}},schema,components));
  assert.deepEqual(normalizeEditorialContent({},schema,components), {});
});
test("image alternatives and decorative transitions", () => {
  const image = {mime:"image/png"};
  assert.throws(()=>validateImageInfo({alternativeText:"  "},image));
  assert.deepEqual(validateImageInfo({alternativeText:" description ",decorative:false},image),{alternativeText:"description",decorative:false});
  assert.equal(validateImageInfo({decorative:true},image,{alternativeText:"old"}).alternativeText,"");
  assert.throws(()=>validateImageInfo({decorative:false},image,{decorative:true,alternativeText:""}));
  assert.doesNotThrow(()=>validateImageInfo({}, {mime:"application/pdf"}));
});
test("invalid batch and replacement stop before provider writes or deletes", async () => {
  let writes=0;
  const plugin:any = {contentTypes:{file:{schema:{attributes:{}}}}, services:{
    upload:()=>({upload:async()=>{writes++;return[]},replace:async()=>{writes++},findOne:async()=>({mime:"image/png",alternativeText:"old"}),remove:async()=>{}}),
    provider:()=>({upload:async()=>{writes++}}),
  }};
  const extended=extendUploadWithEditorialRules(plugin);
  const service=extended.services.upload({});
  await assert.rejects(()=>service.upload({files:[{mimetype:"image/png"},{mimetype:"image/png"}],data:{fileInfo:[{alternativeText:"valid"},{}]}}));
  await assert.rejects(()=>service.replace(1,{file:{mimetype:"image/png"},data:{fileInfo:{alternativeText:""}}}));
  assert.equal(writes,0);
});
