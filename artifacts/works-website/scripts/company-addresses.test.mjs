import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { companyAddresses, companyImprint, registeredPostalAddress, OFFICE_ADDRESS, REGISTERED_ADDRESS } from "../src/data/organization.ts";

test("canonical display and PostalAddress agree exactly", () => {
  const addresses = companyAddresses();
  assert.equal(addresses.office, "1118 Budapest, Himfy utca 1.");
  assert.equal(addresses.registered, "1118 Budapest, Ménesi út 18.");
  assert.equal(addresses.legalName, "Works. Hungary Kft.");
  const postal = registeredPostalAddress();
  assert.deepEqual(postal, { "@type": "PostalAddress", postalCode: "1118", addressLocality: "Budapest", streetAddress: "Ménesi út 18.", addressCountry: "HU" });
  assert.equal(`${postal.postalCode} ${postal.addressLocality}, ${postal.streetAddress}`, addresses.registered);
});

test("old spellings normalize but new editor-authored addresses remain editable", () => {
  assert.equal(companyAddresses({ address: "1118 Budapest Himfy utca 1." }).office, OFFICE_ADDRESS);
  assert.equal(companyAddresses({ address: "1118 Budapest, Himfy utca 2." }).office, "1118 Budapest, Himfy utca 2.");
  const settings = { registeredAddress: "1118 Budapest, Ménesi út 20." };
  assert.equal(registeredPostalAddress(settings).streetAddress, "Ménesi út 20.");
  assert.equal(companyAddresses(settings).registered, settings.registeredAddress);
  assert.throws(() => registeredPostalAddress({ registeredAddress: "invalid" }));
});

test("imprint updates only company rows, preserves all other legal text, and is idempotent", () => {
  const seed = JSON.parse(readFileSync(new URL("../../strapi/src/seed-documents/legal-hu.json", import.meta.url)));
  const before = seed.imprintBody;
  const after = companyImprint(before);
  assert.ok(after.includes(`| Iroda | ${OFFICE_ADDRESS} |`));
  assert.ok(after.includes(`| Székhely | Works. Hungary Kft., ${REGISTERED_ADDRESS} |`));
  assert.equal(after.slice(after.indexOf("\n## Banki adatok")), before.slice(before.indexOf("\n## Banki adatok")));
  assert.equal(companyImprint(after), after);
  assert.equal(companyImprint(""), "");
  assert.equal(companyImprint("Unrelated legal text"), "Unrelated legal text");
});

test("footer, contact and imprint share the address contract; labels are bilingual", () => {
  for (const file of ["components/layout/Footer.tsx", "pages/Contact.tsx"]) {
    const code = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
    assert.ok(code.includes("companyAddresses("));
    assert.ok(code.includes('t("footer.officeLabel")'));
    assert.ok(code.includes('t("footer.registeredLabel")'));
  }
  const legal = readFileSync(new URL("../src/pages/LegalPage.tsx", import.meta.url), "utf8");
  assert.ok(legal.includes("companyImprint(rawBody, settings)"));
  const messages = readFileSync(new URL("../src/i18n/messages.ts", import.meta.url), "utf8");
  for (const text of ['officeLabel: "Iroda"', 'registeredLabel: "Székhely"', 'officeLabel: "Office"', 'registeredLabel: "Registered office"']) assert.ok(messages.includes(text));
});
