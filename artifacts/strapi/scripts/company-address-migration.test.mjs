import { test } from "node:test";
import assert from "node:assert/strict";
import { addressPatch } from "../src/company-address-migration.ts";

test("only target global scalar fields, for both locales and versions", () => {
  for (const locale of ["hu", "en"]) for (const publishedAt of [null, "2026-01-01"]) {
    const row = { locale, publishedAt, address: "old", registeredAddress: null, logo: { id: 9 }, title: "pending" };
    const original = structuredClone(row);
    const patch = addressPatch("global", row);
    assert.deepEqual(Object.keys(patch), ["address", "registeredAddress"]);
    assert.equal(patch.address, "1118 Budapest, Himfy utca 1.");
    assert.deepEqual(addressPatch("global", { ...row, ...patch }), {});
    assert.deepEqual(row, original);
  }
});
test("imprint keeps all unrelated text and never changes EN legal drafts", () => {
  const row = { locale: "hu", imprintBody: "Pending editorial text\n| Székhely | old |\n| Levelezési cím | old |\n## Banki adatok\nBank and provider address" };
  const { imprintBody } = addressPatch("legal", row);
  assert.ok(imprintBody.startsWith("Pending editorial text\n"));
  assert.ok(imprintBody.endsWith("Bank and provider address"));
  assert.ok(imprintBody.includes("Works. Hungary Kft., 1118 Budapest, Ménesi út 18."));
  assert.deepEqual(addressPatch("legal", { ...row, imprintBody }), {});
  assert.deepEqual(addressPatch("legal", { ...row, locale: "en" }), {});
  assert.throws(() => addressPatch("legal", { locale: "hu", imprintBody: "unknown template" }));
});
