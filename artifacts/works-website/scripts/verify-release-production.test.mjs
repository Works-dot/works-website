import assert from "node:assert/strict";
import test from "node:test";
import { verifyRelease } from "./verify-release-production.mjs";

const baseOptions = {
  commitSha: "abc123",
  token: "not-logged",
  productionUrl: "https://example.com",
  timeoutMs: 100,
  pollIntervalMs: 1,
  log: () => {},
};

function response(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("waits for the exact Railway context then checks both routes", async () => {
  let statusReads = 0;
  const checkedUrls = [];
  const fetchImpl = async (url) => {
    if (url.includes("/commits/abc123/status")) {
      statusReads += 1;
      const state = statusReads === 1 ? "pending" : "success";
      return response(200, {
        statuses: [
          { context: "works-website - @workspace/strapi", state: "success" },
          {
            context: "works-website - @workspace/works-website",
            state,
          },
        ],
      });
    }
    checkedUrls.push(url);
    return response(200);
  };

  await verifyRelease({ ...baseOptions, fetchImpl, sleep: async () => {} });

  assert.deepEqual(checkedUrls, [
    "https://example.com/",
    "https://example.com/szolgaltatasok/ux-kutatas",
  ]);
});

test("fails clearly when Railway reports failure", async () => {
  const fetchImpl = async () =>
    response(200, {
      statuses: [
        {
          context: "works-website - @workspace/works-website",
          state: "failure",
          description: "Build failed",
        },
      ],
    });

  await assert.rejects(
    verifyRelease({ ...baseOptions, fetchImpl }),
    /Railway website deployment failed.*Build failed/,
  );
});

test("fails clearly when the exact Railway status times out", async () => {
  const fetchImpl = async () => response(200, { statuses: [] });

  await assert.rejects(
    verifyRelease({
      ...baseOptions,
      fetchImpl,
      timeoutMs: 1,
      sleep: async () => new Promise((resolve) => setTimeout(resolve, 2)),
    }),
    /Timed out.*status not found/,
  );
});

test("fails when a production route does not return HTTP 200", async () => {
  const fetchImpl = async (url) => {
    if (url.includes("/commits/abc123/status")) {
      return response(200, {
        statuses: [
          {
            context: "works-website - @workspace/works-website",
            state: "success",
          },
        ],
      });
    }
    return response(url.endsWith("/szolgaltatasok/ux-kutatas") ? 503 : 200);
  };

  await assert.rejects(
    verifyRelease({ ...baseOptions, fetchImpl }),
    /szolgaltatasok\/ux-kutatas returned HTTP 503/,
  );
});