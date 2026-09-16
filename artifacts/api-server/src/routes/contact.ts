import { Router, type IRouter } from "express";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Works. kapcsolat <design@worksdot.hu>";
const DEFAULT_TO = "info@worksdot.hu";

const router: IRouter = Router();

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeCvUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

router.post("/contact/send", async (req, res): Promise<void> => {
  const name = text(req.body?.name, 120);
  const email = text(req.body?.email, 254).toLowerCase();
  const subject = text(req.body?.subject, 160);
  const message = text(req.body?.message, 5000);
  const cvUrl = safeCvUrl(req.body?.cvUrl);

  if (
    !name ||
    !email ||
    !EMAIL_PATTERN.test(email) ||
    !subject ||
    !message ||
    req.body?.privacyAccepted !== true
  ) {
    res.status(400).json({ ok: false, code: "invalid_request" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    req.log.error("RESEND_API_KEY is not configured");
    res.status(503).json({ ok: false, code: "service_unavailable" });
    return;
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

    const result = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok || !result?.id) {
      req.log.error(
        {
          providerStatus: response.status,
          providerError: result?.name || "unknown",
          providerMessage: result?.message || "No provider message",
        },
        "Resend rejected contact email",
      );
      res.status(502).json({ ok: false, code: "provider_error" });
      return;
    }

    req.log.info({ resendEmailId: result.id }, "Contact email accepted by Resend");
    res.json({ ok: true, code: "sent" });
  } catch (error) {
    req.log.error(
      { err: error instanceof Error ? error : new Error("Unknown contact email error") },
      "Contact email delivery failed",
    );
    res.status(503).json({ ok: false, code: "service_unavailable" });
  }
});

export default router;