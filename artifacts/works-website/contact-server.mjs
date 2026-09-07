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

export async function sendContactMessage(payload) {
  const name = text(payload?.name, 120);
  const email = text(payload?.email, 254).toLowerCase();
  const subject = text(payload?.subject, 160);
  const message = text(payload?.message, 5000);
  const cvUrl = safeCvUrl(payload?.cvUrl);

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
    console.error("RESEND_API_KEY is not configured");
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
  const to = process.env.RESEND_TO_EMAIL?.trim() || DEFAULT_TO;
  const escapedMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const cvHtml = cvUrl
    ? `<p><strong>Önéletrajz:</strong> <a href="${escapeHtml(cvUrl)}">Fájl megnyitása</a></p>`
    : "";
  const cvText = cvUrl ? `\nÖnéletrajz: ${cvUrl}` : "";

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Kapcsolatfelvétel: ${subject}`,
        html: [
          `<p><strong>Név:</strong> ${escapeHtml(name)}</p>`,
          `<p><strong>E-mail:</strong> ${escapeHtml(email)}</p>`,
          `<p><strong>Tárgy:</strong> ${escapeHtml(subject)}</p>`,
          `<p><strong>Üzenet:</strong><br>${escapedMessage}</p>`,
          cvHtml,
        ].join(""),
        text: `Név: ${name}\nE-mail: ${email}\nTárgy: ${subject}\n\nÜzenet:\n${message}${cvText}`,
      }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.id) {
      const providerError = typeof result?.name === "string" ? result.name : "unknown";
      console.error(`Resend contact email rejected (${response.status}, ${providerError})`);
      return { status: 502, body: { ok: false, code: "provider_error" } };
    }

    console.info(`Contact email accepted by Resend (${result.id})`);
    return { status: 200, body: { ok: true, code: "sent" } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`Contact email delivery failed: ${message}`);
    return { status: 503, body: { ok: false, code: "service_unavailable" } };
  }
}