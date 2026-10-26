import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { subscribeNewsletter } from "../newsletter-server.mjs";

// Synthetic key only. Never use a real account or send network requests.
const key = "synthetic-test-only-us17";
async function run(email, replies, expectedStatus, configuredKey = key) {
  const previousKey = process.env.MAILCHIMP_API_KEY;
  const previousFetch = globalThis.fetch;
  const calls = [];
  if (configuredKey === null) delete process.env.MAILCHIMP_API_KEY;
  else process.env.MAILCHIMP_API_KEY = configuredKey;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    const reply = replies.shift();
    assert.ok(reply, "Unexpected provider request");
    if (reply instanceof Error) throw reply;
    return { ok: reply.code >= 200 && reply.code < 300, status: reply.code,
      json: async () => reply.body };
  };
  try {
    const result = await subscribeNewsletter(email);
    assert.equal(result.status, expectedStatus);
    assert.equal(result.body.ok, expectedStatus === 200);
    assert.ok(!JSON.stringify(result).includes(key));
    return calls;
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.MAILCHIMP_API_KEY;
    else process.env.MAILCHIMP_API_KEY = previousKey;
  }
}

test("validates email and configuration before any network call", async () => {
  assert.equal((await run("invalid", [], 400)).length, 0);
  assert.equal((await run("test@example.com", [], 503, null)).length, 0);
  assert.equal((await run("test@example.com", [], 503, "no-data-center")).length, 0);
});
test("existing subscriber is idempotent and uses the key's data center", async () => {
  const calls = await run(" TEST@Example.com ", [
    { code: 200, body: { status: "subscribed" } },
  ], 200);
  assert.equal(calls.length, 1);
  const hash = createHash("md5").update("test@example.com").digest("hex");
  assert.equal(calls[0].url, `https://us17.api.mailchimp.com/3.0/lists/3f0813c75a/members/${hash}`);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.redirect, "error");
  assert.equal(calls[0].options.headers.Authorization,
    `Basic ${Buffer.from(`works:${key}`).toString("base64")}`);
  assert.ok(calls[0].options.signal instanceof AbortSignal);
});
test("new subscriber is upserted into the existing list with single opt-in", async () => {
  const calls = await run(" TEST@Example.com ", [
    { code: 404, body: {} }, { code: 200, body: { status: "subscribed" } },
  ], 200);
  assert.equal(calls[1].options.method, "PUT");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    email_address: "test@example.com", status_if_new: "subscribed", status: "subscribed",
  });
});
test("explicit re-subscription preserves existing behavior", async () => {
  const calls = await run("test@example.com", [
    { code: 200, body: { status: "unsubscribed" } },
    { code: 200, body: { status: "subscribed" } },
  ], 200);
  assert.equal(calls.length, 2);
});
test("authentication and provider failures do not produce false success or writes", async () => {
  for (const code of [401, 403, 429, 500]) {
    assert.equal((await run("test@example.com", [{ code, body: {} }], 502)).length, 1);
  }
  await run("test@example.com", [
    { code: 404, body: {} }, { code: 400, body: { title: "Invalid Resource" } },
  ], 400);
  await run("test@example.com", [
    { code: 404, body: {} }, { code: 200, body: { status: "pending" } },
  ], 502);
  await run("test@example.com", [new Error("Network failed")], 503);
});
