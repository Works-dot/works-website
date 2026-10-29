import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { companyAddresses, registeredPostalAddress } from "../src/data/organization.ts";

const expected = companyAddresses();
for (const route of ["", "kapcsolat/", "en/contact/", "impresszum/"]) {
  const html = readFileSync(new URL(`../dist/public/${route}index.html`, import.meta.url), "utf8");
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer, `Footer missing: ${route}`);
  for (const text of [expected.office, expected.registered, expected.legalName]) {
    assert.ok(footer.includes(text), `Footer ${route}: ${text}`);
    if (route) {
      const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";
      assert.ok(main.includes(text), `Page content ${route}: ${text}`);
    }
  }
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map(match => JSON.parse(match[1]));
  const organizations = schemas.filter(schema => schema["@type"] === "Organization");
  assert.equal(organizations.length, 1, `One Organization per page: ${route}`);
  assert.deepEqual(organizations[0].address, registeredPostalAddress());
  assert.equal(organizations[0].legalName, expected.legalName);
  assert.equal(html.includes("1118 Budapest Himfy utca 1."), false, `Old spelling in ${route}`);
  console.log(`Verified addresses and Organization: /${route}`);
}
