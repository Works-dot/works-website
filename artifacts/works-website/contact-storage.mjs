import { createHash, createHmac } from "node:crypto";

export const referralLabels = Object.freeze({
  google: "Google-keresés",
  ai: "AI-asszisztens (ChatGPT, Gemini stb.)",
  linkedin: "LinkedIn",
  recommendation: "ajánlás",
  directory: "Clutch vagy más katalógus",
  other: "egyéb",
});

export function referralValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !Object.hasOwn(referralLabels, value)) {
    throw new Error("invalid_referral");
  }
  return value;
}

export function submissionKey(data, id) {
  return createHash("sha256").update(id || JSON.stringify(data)).digest("hex");
}

export async function contactStorage(action, data) {
  const secret = process.env.CONTACT_SUBMISSION_SECRET || process.env.SESSION_SECRET;
  const base = process.env.STRAPI_CONTACT_URL ||
    (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8099" : "");
  if (!secret || !base) throw new Error("contact_storage_not_configured");
  const url = new URL(`${base.replace(/\/$/, "")}/api/internal/contact-submissions`);
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("contact_storage_requires_https");
  }
  const body = { action, ...data };
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret)
    .update(`works-contact-v1\n${timestamp}\n${JSON.stringify(body)}`).digest("hex");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Contact-Time": timestamp, "X-Contact-Signature": signature },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) throw new Error("contact_storage_failed");
  return result;
}
