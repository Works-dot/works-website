import assert from "node:assert/strict";

const apiEndpoint =
  process.env.CONTACT_API_URL ||
  "https://works-website.replit.app/api/contact/send";
const frontendUrl = (
  process.env.CONTACT_FRONTEND_URL ||
  "https://workspaceworks-website-production.up.railway.app"
).replace(/\/+$/, "");

const response = await fetch(apiEndpoint, {
  method: "POST",
  credentials: "omit",
  headers: {
    "Content-Type": "application/json",
    Origin: frontendUrl,
  },
  body: JSON.stringify({
    name: "Production contract check",
    email: "invalid",
    subject: "Test",
    message: "This request must be rejected before sending.",
    privacyAccepted: true,
  }),
});
const body = await response.json().catch(() => null);

assert.equal(response.status, 400, "Invalid contact request must return HTTP 400");
assert.deepEqual(body, { ok: false, code: "invalid_request" });
console.log("✓ Public contact endpoint rejects an invalid request");