// Side-effect-free production contract verification for the newsletter flow.
import assert from "node:assert/strict";

const apiEndpoint =
  process.env.NEWSLETTER_API_URL ||
  "https://works-website.replit.app/api/newsletter/subscribe";
const frontendUrl = (
  process.env.NEWSLETTER_FRONTEND_URL ||
  "https://workspaceworks-website-production.up.railway.app"
).replace(/\/+$/, "");

async function assertInvalidEmailContract() {
  const response = await fetch(apiEndpoint, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Origin: frontendUrl,
    },
    body: JSON.stringify({ email: "invalid" }),
  });
  const body = await response.json().catch(() => null);

  assert.equal(response.status, 400, "Invalid email must return HTTP 400");
  assert.deepEqual(body, { ok: false, code: "invalid_email" });
  console.log("✓ Public newsletter endpoint rejects an invalid email");
}

function findJavaScriptReferences(source) {
  const references = new Set();
  const pattern = /(?:^|["'(])((?:\/)?assets\/[A-Za-z0-9_.-]+\.js)/g;

  for (const match of source.matchAll(pattern)) {
    references.add(new URL(match[1], `${frontendUrl}/`).href);
  }

  return references;
}

async function assertFrontendBundleUsesPublicEndpoint() {
  const response = await fetch(`${frontendUrl}/`);
  assert.equal(response.status, 200, "Railway frontend must be publicly reachable");

  const html = await response.text();
  const scriptTagStart = "<" + "script";
  const entryMatch = html.match(
    new RegExp(
      `${scriptTagStart}[^>]+type=["']module["'][^>]+src=["']([^"']+\\.js)["']`,
    ),
  );
  assert.ok(entryMatch, "Railway frontend entry bundle is missing");

  const queue = [new URL(entryMatch[1], `${frontendUrl}/`).href];
  const visited = new Set();

  while (queue.length > 0 && visited.size < 100) {
    const assetUrl = queue.shift();
    if (!assetUrl || visited.has(assetUrl)) continue;
    visited.add(assetUrl);

    const assetResponse = await fetch(assetUrl);
    assert.equal(assetResponse.status, 200, `Frontend asset failed: ${assetUrl}`);
    const source = await assetResponse.text();

    if (source.includes(apiEndpoint)) {
      console.log("✓ Railway frontend bundle uses the public newsletter endpoint");
      return;
    }

    for (const reference of findJavaScriptReferences(source)) {
      if (!visited.has(reference)) queue.push(reference);
    }
  }

  assert.fail("Railway frontend bundle does not contain the public newsletter endpoint");
}

await assertInvalidEmailContract();
await assertFrontendBundleUsesPublicEndpoint();