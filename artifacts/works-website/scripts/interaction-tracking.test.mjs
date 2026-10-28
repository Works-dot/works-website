import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contactLinkEvent, emitInteraction } from "../src/lib/interaction-tracking.ts";

test("only analytics permission allows the three PII-free events", () => {
  for (const analytics of [false, true]) for (const advertising of [false, true]) {
    globalThis.window = { dataLayer: [], localStorage: { getItem: () =>
      JSON.stringify({ version: 3, analytics, advertising, map: true }) } };
    for (const event of ["newsletter_signup", "email_click", "phone_click"]) emitInteraction(event);
    assert.deepEqual(window.dataLayer, analytics
      ? ["newsletter_signup", "email_click", "phone_click"].map(event => ({ event })) : []);
  }
});

test("newsletter requires permission at submission and success; old values fail closed", () => {
  let value = JSON.stringify({ version: 3, analytics: true, advertising: false, map: false });
  globalThis.window = { dataLayer: [], localStorage: { getItem: () => value } };
  emitInteraction("newsletter_signup", false);
  for (value of ["accepted", "rejected", null, JSON.stringify({ version: 3, analytics: false, advertising: true, map: true })]) {
    emitInteraction("newsletter_signup", true);
  }
  window.localStorage.getItem = () => { throw Error("blocked"); };
  assert.doesNotThrow(() => emitInteraction("email_click"));
  assert.deepEqual(window.dataLayer, []);
});

test("link classification does not transmit destination data", () => {
  assert.equal(contactLinkEvent("mailto:example@example.test?subject=private"), "email_click");
  assert.equal(contactLinkEvent(" TEL:+361234567 "), "phone_click");
  for (const href of [null, "", "/contact", "https://example.test", "javascript:tel:"]) {
    assert.equal(contactLinkEvent(href), null);
  }
});

test("newsletter emits only after validated server success and before returning", () => {
  const code = readFileSync(new URL("../src/hooks/use-newsletter.ts", import.meta.url), "utf8");
  assert.ok(code.indexOf("const grantedAtSubmit") < code.indexOf("await fetch"));
  assert.ok(code.indexOf('result.code !== "subscribed"') < code.indexOf('emitInteraction("newsletter_signup"'));
  assert.ok(code.indexOf("throw new NewsletterError") < code.indexOf('emitInteraction("newsletter_signup"'));
  assert.equal((code.match(/emitInteraction\("newsletter_signup"/g) || []).length, 1);
});
