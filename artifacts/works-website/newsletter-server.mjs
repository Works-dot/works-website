import { createHash } from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";

const AUDIENCE_ID = "3f0813c75a";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function readJson(response) {
  return response.json().catch(() => null);
}

export async function subscribeNewsletter(rawEmail) {
  const email = normalizeEmail(rawEmail);

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: 400, body: { ok: false, code: "invalid_email" } };
  }

  try {
    const connectors = new ReplitConnectors();
    const memberHash = createHash("md5").update(email).digest("hex");
    const memberPath = `/3.0/lists/${AUDIENCE_ID}/members/${memberHash}`;
    const existingResponse = await connectors.proxy("mailchimp", memberPath, {
      method: "GET",
    });
    const existing = await readJson(existingResponse);

    if (existingResponse.ok && existing?.status === "subscribed") {
      return { status: 200, body: { ok: true, code: "subscribed" } };
    }

    if (!existingResponse.ok && existingResponse.status !== 404) {
      console.error(`Mailchimp member lookup failed (${existingResponse.status})`);
      return { status: 502, body: { ok: false, code: "provider_error" } };
    }

    const response = await connectors.proxy("mailchimp", memberPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        status: "subscribed",
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      const title = typeof result?.title === "string" ? result.title : "unknown";
      console.error(`Mailchimp subscription rejected (${response.status}, ${title})`);
      return response.status === 400
        ? { status: 400, body: { ok: false, code: "invalid_email" } }
        : { status: 502, body: { ok: false, code: "provider_error" } };
    }

    return { status: 200, body: { ok: true, code: "subscribed" } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Newsletter subscription failed: ${message}`);
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }
}