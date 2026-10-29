import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerContactSubmissionRoutes } from "../../strapi/src/contact-submissions.ts";

function setup(t) {
  const env = process.env;
  process.env = { ...env, SESSION_SECRET: "test-only" };
  t.after(() => { process.env = env; });
  const rows = new Map();
  let route;
  const query = {
    findOne: async ({ where }) => rows.get(where.submissionKey),
    update: async ({ where, data }) => {
      Object.assign([...rows.values()].find(r => r.id === where.id), data);
    },
  };
  const strapi = {
    server: { routes: routes => { [route] = routes; } },
    log: { error() {} },
    db: { query: () => query },
    documents: () => ({
      create: async ({ data }) => {
        if (rows.has(data.submissionKey)) throw new Error("unique");
        const row = { ...data, id: rows.size + 1, documentId: "test-doc", createdAt: new Date().toISOString() };
        rows.set(data.submissionKey, row);
        return row;
      },
    }),
  };
  registerContactSubmissionRoutes(strapi);
  const request = async (body, { unsigned, old, tamper } = {}) => {
    const timestamp = String(Date.now() - (old ? 120000 : 0));
    const signature = createHmac("sha256", "test-only")
      .update(`works-contact-v1\n${timestamp}\n${JSON.stringify(body)}`).digest("hex");
    const ctx = { status: 200, request: { body: tamper ? { ...body, action: "complete" } : body },
      get: key => key === "X-Contact-Time" ? timestamp : unsigned ? "" : signature };
    await route.handler(ctx);
    return ctx;
  };
  return { rows, request };
}

const prepare = {
  action: "prepare", key: "a".repeat(64), contentHash: "b".repeat(64),
  submission: { name: "TEST", email: "test@example.com", subject: "TEST",
    message: "TEST", privacyAccepted: true, referralSource: "ai", referralLabel: "AI-asszisztens (ChatGPT, Gemini stb.)" },
};

test("unsigned, stale, and tampered signatures cannot read or write submissions", async (t) => {
  const { rows, request } = setup(t);
  for (const options of [{ unsigned: true }, { old: true }, { tamper: true }]) {
    assert.equal((await request(prepare, options)).status, 403);
  }
  assert.equal(rows.size, 0);
});

test("prepare is durable, retry and concurrent prepare create only one record", async (t) => {
  const { rows, request } = setup(t);
  const results = await Promise.all([request(prepare), request(prepare)]);
  assert.ok(results.every(r => r.body.ok));
  assert.equal(rows.size, 1);
  assert.equal(rows.get(prepare.key).referralSource, "ai");
  assert.equal(rows.get(prepare.key).deliveryStatus, "pending");
  assert.ok(rows.get(prepare.key).documentId);
});

test("completion records provider ID; successful retries are already sent", async (t) => {
  const { rows, request } = setup(t);
  await request(prepare);
  assert.equal((await request({ ...prepare, action: "complete", emailId: "provider-id" })).body.sent, true);
  assert.equal(rows.get(prepare.key).emailId, "provider-id");
  assert.equal((await request(prepare)).body.sent, true);
});

test("key reuse with changed contents is rejected", async (t) => {
  const { request } = setup(t);
  await request(prepare);
  assert.equal((await request({ ...prepare, contentHash: "c".repeat(64) })).status, 409);
});

test("old pending attempts cannot resend beyond provider deduplication window", async (t) => {
  const { rows, request } = setup(t);
  await request(prepare);
  rows.get(prepare.key).createdAt = new Date(Date.now() - 24 * 3600000).toISOString();
  assert.equal((await request(prepare)).status, 409);
  // Reconciliation of an already accepted email can still finish the record.
  assert.equal((await request({ ...prepare, action: "complete", emailId: "provider-id" })).status, 200);
  assert.equal((await request(prepare)).body.sent, true);
});

test("unknown source rejected even at internal storage boundary", async (t) => {
  const { rows, request } = setup(t);
  assert.equal((await request({ ...prepare, submission: { ...prepare.submission, referralSource: "unknown" } })).status, 400);
  assert.equal(rows.size, 0);
});
