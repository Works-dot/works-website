import {
  ProviderTimeoutError,
  PROVIDER_TIMEOUT_MS,
  withTimeout,
} from "./server-error.mjs";
import { contactStorage, referralLabels, referralValue, submissionKey } from "./contact-storage.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Works. kapcsolat <design@worksdot.hu>";
const DEFAULT_TO = "info@worksdot.hu";

function text(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeCvUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function sendContactMessage(payload, logger = console) {
  const name = text(payload?.name, 120);
  const email = text(payload?.email, 254).toLowerCase();
  const subject = text(payload?.subject, 160);
  const message = text(payload?.message, 5000);
  const cvUrl = safeCvUrl(payload?.cvUrl);
  let referralSource;
  try {
    referralSource = referralValue(payload?.referralSource);
  } catch {
    return { status: 400, body: { ok: false, code: "invalid_request" } };
  }
  if (payload?.submissionId !== undefined &&
      (typeof payload.submissionId !== "string" || !/^[a-f0-9-]{36}$/i.test(payload.submissionId))) {
    return { status: 400, body: { ok: false, code: "invalid_request" } };
  }

  if (
    !name ||
    !email ||
    !EMAIL_PATTERN.test(email) ||
    !subject ||
    !message ||
    payload?.privacyAccepted !== true
  ) {
    return { status: 400, body: { ok: false, code: "invalid_request" } };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.error("RESEND_API_KEY is not configured");
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const to = process.env.RESEND_TO_EMAIL?.trim() || DEFAULT_TO;
  const escapedMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const cvHtml = cvUrl
    ? `<p><strong>Önéletrajz:</strong> <a href="${escapeHtml(cvUrl)}">Fájl megnyitása</a></p>`
    : "";
  const cvText = cvUrl ? `\nÖnéletrajz: ${cvUrl}` : "";
  const referralLabel = referralSource ? referralLabels[referralSource] : "Nincs megadva";
  const submission = { name, email, subject, message, cvUrl, referralSource, referralLabel, privacyAccepted: true };
  const contentHash = submissionKey(submission);
  const key = submissionKey(submission, payload?.submissionId);

  try {
    const saved = await contactStorage("prepare", { key, contentHash, submission });
    if (saved.sent) return { status: 200, body: { ok: true, code: "sent" } };
    const { response, result } = await withTimeout(async (signal) => {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `works-contact-${key}`,
        },
        signal,
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `Kapcsolatfelvétel: ${subject}`,
          html: [
            `<p><strong>Név:</strong> ${escapeHtml(name)}</p>`,
            `<p><strong>E-mail:</strong> ${escapeHtml(email)}</p>`,
            `<p><strong>Tárgy:</strong> ${escapeHtml(subject)}</p>`,
            `<p><strong>Honnan hallott rólunk?</strong> ${escapeHtml(referralLabel)}</p>`,
            `<p><strong>Üzenet:</strong><br>${escapedMessage}</p>`,
            cvHtml,
          ].join(""),
          text: `Név: ${name}\nE-mail: ${email}\nTárgy: ${subject}\nHonnan hallott rólunk? ${referralLabel}\n\nÜzenet:\n${message}${cvText}`,
        }),
      });
      const result =
        typeof response?.json === "function"
          ? await Promise.resolve(response.json()).catch(() => null)
          : null;
      return { response, result };
    }, PROVIDER_TIMEOUT_MS);

    if (!response.ok || !result?.id) {
      const providerError = typeof result?.name === "string" ? result.name : "unknown";
      logger.error(`Resend contact email rejected (${response.status}, ${providerError})`);
      return { status: 502, body: { ok: false, code: "provider_error" } };
    }

    logger.info(`Contact email accepted by Resend (${result.id})`);
    await contactStorage("complete", { key, contentHash, emailId: result.id });
    return { status: 200, body: { ok: true, code: "sent" } };
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      logger.error("Contact email delivery timed out");
      return { status: 503, body: { ok: false, code: "service_unavailable" } };
    }
    logger.error("Contact email delivery or storage failed");
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }
}