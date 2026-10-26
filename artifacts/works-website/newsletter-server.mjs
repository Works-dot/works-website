import { createHash } from "node:crypto";
import {
  ProviderTimeoutError,
  PROVIDER_TIMEOUT_MS,
  withTimeout,
} from "./server-error.mjs";

const AUDIENCE_ID = "3f0813c75a";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function readJson(response) {
  if (!response || typeof response.json !== "function") return null;
  return Promise.resolve(response.json()).catch(() => null);
}

export async function subscribeNewsletter(rawEmail) {
  const email = normalizeEmail(rawEmail);

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: 400, body: { ok: false, code: "invalid_email" } };
  }

  try {
    const apiKey = process.env.MAILCHIMP_API_KEY?.trim();
    const dataCenter = apiKey?.match(/-(us\d+)$/)?.[1];
    if (!apiKey || !dataCenter) {
      console.error("Mailchimp API key is missing or has no valid data-center suffix");
      return { status: 503, body: { ok: false, code: "service_unavailable" } };
    }
    // Derive the data center from the key; do not mix credentials with a
    // separately configured server prefix. Credentials never reach the client.
    const request = (path, options) => fetch(
      `https://${dataCenter}.api.mailchimp.com${path}`,
      {
        ...options,
        redirect: "error",
        headers: {
          ...options.headers,
          Authorization: `Basic ${Buffer.from(`works:${apiKey}`).toString("base64")}`,
        },
      },
    );
    const memberHash = createHash("md5").update(email).digest("hex");
    const memberPath = `/3.0/lists/${AUDIENCE_ID}/members/${memberHash}`;
    const { response: existingResponse, body: existing } = await withTimeout(
      async (signal) => {
        const response = await request(memberPath, {
          method: "GET",
          signal,
        });
        return { response, body: await readJson(response) };
      },
      PROVIDER_TIMEOUT_MS,
    );

    if (existingResponse.ok && existing?.status === "subscribed") {
      return { status: 200, body: { ok: true, code: "subscribed" } };
    }

    if (!existingResponse.ok && existingResponse.status !== 404) {
      console.error(`Mailchimp member lookup failed (${existingResponse.status})`);
      return { status: 502, body: { ok: false, code: "provider_error" } };
    }

    const { response, body: result } = await withTimeout(
      async (signal) => {
        const response = await request(memberPath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            email_address: email,
            status_if_new: "subscribed",
            status: "subscribed",
          }),
        });
        return { response, body: await readJson(response) };
      },
      PROVIDER_TIMEOUT_MS,
    );

    if (!response.ok) {
      const title = typeof result?.title === "string" ? result.title : "unknown";
      console.error(`Mailchimp subscription rejected (${response.status}, ${title})`);
      return response.status === 400
        ? { status: 400, body: { ok: false, code: "invalid_email" } }
        : { status: 502, body: { ok: false, code: "provider_error" } };
    }

    if (result?.status !== "subscribed") {
      console.error("Mailchimp did not confirm subscribed status");
      return { status: 502, body: { ok: false, code: "provider_error" } };
    }
    return { status: 200, body: { ok: true, code: "subscribed" } };
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      console.error("Newsletter subscription timed out");
      return { status: 503, body: { ok: false, code: "service_unavailable" } };
    }
    // Transport errors can contain URLs or headers; never log provider details.
    console.error("Newsletter subscription transport failed");
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }
}