import { createHash } from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { Router, type IRouter } from "express";

const AUDIENCE_ID = "3f0813c75a";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router: IRouter = Router();

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

router.post("/newsletter/subscribe", async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ ok: false, code: "invalid_email" });
    return;
  }

  try {
    const connectors = new ReplitConnectors();
    const memberHash = createHash("md5").update(email).digest("hex");
    const memberPath = `/3.0/lists/${AUDIENCE_ID}/members/${memberHash}`;
    const existingResponse = await connectors.proxy("mailchimp", memberPath, {
      method: "GET",
    });
    const existing = await existingResponse.json().catch(() => null) as {
      status?: string;
    } | null;

    if (existingResponse.ok && existing?.status === "subscribed") {
      res.json({ ok: true, code: "subscribed" });
      return;
    }

    if (!existingResponse.ok && existingResponse.status !== 404) {
      req.log.error(
        { providerStatus: existingResponse.status },
        "Mailchimp member lookup failed",
      );
      res.status(502).json({ ok: false, code: "provider_error" });
      return;
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
    const result = await response.json().catch(() => null) as {
      title?: string;
    } | null;

    if (!response.ok) {
      req.log.error(
        { providerStatus: response.status, providerTitle: result?.title || "unknown" },
        "Mailchimp subscription rejected",
      );
      res
        .status(response.status === 400 ? 400 : 502)
        .json({
          ok: false,
          code: response.status === 400 ? "invalid_email" : "provider_error",
        });
      return;
    }

    res.json({ ok: true, code: "subscribed" });
  } catch (error) {
    req.log.error(
      { err: error instanceof Error ? error : new Error("Unknown newsletter error") },
      "Newsletter subscription failed",
    );
    res.status(503).json({ ok: false, code: "service_unavailable" });
  }
});

export default router;