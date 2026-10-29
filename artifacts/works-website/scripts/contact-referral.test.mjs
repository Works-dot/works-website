import test from "node:test";
import assert from "node:assert/strict";
import { sendContactMessage } from "../contact-server.mjs";
import { referralLabels } from "../contact-storage.mjs";
import { createHmac } from "node:crypto";

const payload = {
  name: "Contact test", email: "test@example.com", subject: "TEST",
  message: "<test>", privacyAccepted: true,
};
const logger = { info() {}, error() {} };

function setup(t, { storageFailure, emailFailure, sent = false } = {}) {
  const env = process.env;
  process.env = { ...env, RESEND_API_KEY: "test-only", SESSION_SECRET: "test-only", STRAPI_CONTACT_URL: "https://cms.example.test" };
  t.after(() => { process.env = env; });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    const storage = String(url).includes("cms.example.test");
    const action = storage ? body.action : "email";
    calls.push({ action, body, headers: options.headers });
    if (storage) {
      const expected = createHmac("sha256", "test-only")
        .update(`works-contact-v1\n${options.headers["X-Contact-Time"]}\n${options.body}`).digest("hex");
      assert.equal(options.headers["X-Contact-Signature"], expected);
    }
    if (storageFailure === action || (emailFailure && !storage)) {
      return new Response("{}", { status: 503 });
    }
    return Response.json(storage ? { ok: true, sent } : { id: "test-email" });
  });
  return calls;
}

test("all referral values, omitted and empty: saved before sending, readable in both email formats", async (t) => {
  const calls = setup(t);
  for (const value of [...Object.keys(referralLabels), "", undefined]) {
    calls.length = 0;
    assert.equal((await sendContactMessage({ ...payload, referralSource: value }, logger)).status, 200);
    assert.deepEqual(calls.map(c => c.action), ["prepare", "email", "complete"]);
    assert.equal(calls[0].body.submission.referralSource, value || null);
    const label = referralLabels[value] || "Nincs megadva";
    assert.ok(calls[1].body.html.includes(label));
    assert.ok(calls[1].body.text.includes(label));
    assert.ok(calls[1].body.html.includes("&lt;test&gt;"));
    assert.ok(calls[1].headers["Idempotency-Key"].startsWith("works-contact-"));
  }
});

test("invalid source and missing privacy consent never store or email", async (t) => {
  const calls = setup(t);
  for (const referralSource of ["unknown", "Google-keresés", {}, 3, " google", "__proto__"]) {
    assert.equal((await sendContactMessage({ ...payload, referralSource }, logger)).status, 400);
  }
  assert.equal((await sendContactMessage({ ...payload, privacyAccepted: false }, logger)).status, 400);
  assert.equal(calls.length, 0);
});

test("storage failure prevents email", async (t) => {
  const calls = setup(t, { storageFailure: "prepare" });
  assert.equal((await sendContactMessage(payload, logger)).status, 503);
  assert.deepEqual(calls.map(c => c.action), ["prepare"]);
});

test("email failure never marks stored record as sent", async (t) => {
  const calls = setup(t, { emailFailure: true });
  assert.equal((await sendContactMessage(payload, logger)).status, 502);
  assert.deepEqual(calls.map(c => c.action), ["prepare", "email"]);
});

test("failed completion is not success and retry uses identical provider idempotency key", async (t) => {
  const calls = setup(t, { storageFailure: "complete" });
  for (let i = 0; i < 2; i++) {
    assert.equal((await sendContactMessage(payload, logger)).status, 503);
  }
  const emails = calls.filter(c => c.action === "email");
  assert.equal(emails.length, 2);
  assert.equal(emails[0].headers["Idempotency-Key"], emails[1].headers["Idempotency-Key"]);
  assert.deepEqual(emails[0].body, emails[1].body);
});

test("retry after confirmed success does not send another email", async (t) => {
  const calls = setup(t, { sent: true });
  assert.equal((await sendContactMessage(payload, logger)).status, 200);
  assert.deepEqual(calls.map(c => c.action), ["prepare"]);
});

test("CV is preserved with source; absent analytics consent does not gate delivery", async (t) => {
  const calls = setup(t);
  const cvUrl = "https://example.test/cv.pdf";
  assert.equal((await sendContactMessage({ ...payload, cvUrl, referralSource: "ai", consent_state: "denied" }, logger)).status, 200);
  assert.equal(calls[0].body.submission.cvUrl, cvUrl);
  assert.ok(calls[1].body.html.includes(cvUrl));
  assert.ok(calls[1].body.text.includes(cvUrl));
});
