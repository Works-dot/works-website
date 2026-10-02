import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emitContactFormSuccess } from "../src/lib/contact-tracking.ts";
import { TRACKING_CONSENT_KEY, MAP_CONSENT_KEY } from "../src/lib/consent-storage.ts";

function setBrowser(tracking, map = null) {
  const values = new Map();
  if (tracking) values.set(TRACKING_CONSENT_KEY, tracking);
  if (map) values.set(MAP_CONSENT_KEY, map);
  const dataLayer = [];
  globalThis.window = { dataLayer, localStorage: { getItem: (key) => values.get(key) ?? null } };
  return { dataLayer, values };
}

test("only an accepted submission with continuing analytics consent produces a PII-free success event", () => {
  const { dataLayer } = setBrowser("accepted");
  emitContactFormSuccess(true, true);
  assert.deepEqual(dataLayer, [{ event: "contact_form_success" }]);
});

test("does not replay submissions begun without analytics consent", () => {
  const { dataLayer } = setBrowser("accepted");
  emitContactFormSuccess(false, true);
  assert.deepEqual(dataLayer, []);
});

test("revocation during upload/fetch or from another tab blocks success tracking", () => {
  const { dataLayer, values } = setBrowser("accepted");
  emitContactFormSuccess(true, false);
  values.set(TRACKING_CONSENT_KEY, "rejected");
  emitContactFormSuccess(true, true);
  values.delete(TRACKING_CONSENT_KEY);
  emitContactFormSuccess(true, true);
  assert.deepEqual(dataLayer, []);
});

test("map-only grant, inaccessible storage and blocked dataLayer do not track or throw", () => {
  const { dataLayer } = setBrowser(null, "accepted");
  emitContactFormSuccess(true, true);
  assert.deepEqual(dataLayer, []);
  window.localStorage = { getItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => emitContactFormSuccess(true, true));
  setBrowser("accepted");
  window.dataLayer = { push() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => emitContactFormSuccess(true, true));
});

test("contact success is emitted only after server success, not from submit attempt or upload", () => {
  const source = readFileSync(new URL("../src/pages/Contact.tsx", import.meta.url), "utf8");
  const submit = source.slice(source.indexOf("const handleSubmit = async"), source.indexOf("const handleChange ="));
  assert.ok(submit.indexOf("await sendContactMessage(") < submit.indexOf("emitContactFormSuccess("));
  assert.ok(submit.indexOf("emitContactFormSuccess(") < submit.indexOf("setSubmitted(true)"));
  assert.ok(submit.indexOf("emitContactFormSuccess(") < submit.indexOf("} catch (error)"));
});