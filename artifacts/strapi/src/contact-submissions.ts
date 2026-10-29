import { createHmac, timingSafeEqual } from "node:crypto";

// No content-API routes are registered for this collection, including public reads.
// Only this signed server-to-server endpoint and Strapi's authenticated admin can access it.
export function registerContactSubmissionRoutes(strapi: any) {
  strapi.server.routes([{
    method: "POST",
    path: "/api/internal/contact-submissions",
    config: { auth: false, policies: [] },
    handler: async (ctx: any) => {
      const secret = process.env.CONTACT_SUBMISSION_SECRET || process.env.SESSION_SECRET;
      const timestamp = ctx.get("X-Contact-Time");
      const signature = ctx.get("X-Contact-Signature");
      const body = ctx.request.body;
      if (!secret) { ctx.status = 503; ctx.body = { ok: false }; return; }
      const expected = createHmac("sha256", secret)
        .update(`works-contact-v1\n${timestamp}\n${JSON.stringify(body)}`).digest("hex");
      if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 60000 ||
          !/^[a-f0-9]{64}$/.test(signature) ||
          !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        ctx.status = 403; ctx.body = { ok: false }; return;
      }
      const { action, key, contentHash, submission, emailId } = body;
      if (!/^[a-f0-9]{64}$/.test(key) || !/^[a-f0-9]{64}$/.test(contentHash) ||
          !["prepare", "complete"].includes(action)) {
        ctx.status = 400; ctx.body = { ok: false }; return;
      }
      const query = strapi.db.query("api::contact-submission.contact-submission");
      try {
        let record = await query.findOne({ where: { submissionKey: key } });
        if (!record && action === "prepare") {
          if (!submission || submission.privacyAccepted !== true ||
              (submission.referralSource !== null &&
               !["google", "ai", "linkedin", "recommendation", "directory", "other"].includes(submission.referralSource))) {
            ctx.status = 400; ctx.body = { ok: false }; return;
          }
          const { name, email, subject, message, cvUrl, referralSource, referralLabel, privacyAccepted } = submission;
          try {
            record = await strapi.documents("api::contact-submission.contact-submission").create({ data: {
              submissionKey: key, contentHash, name, email, subject, message, cvUrl,
              referralSource, referralLabel, privacyAccepted, deliveryStatus: "pending",
            } });
          } catch (error) {
            // A simultaneous retry may have won the unique-key insert.
            record = await query.findOne({ where: { submissionKey: key } });
            if (!record) throw error;
          }
        }
        if (!record || record.contentHash !== contentHash) {
          ctx.status = 409; ctx.body = { ok: false }; return;
        }
        if (action === "complete") {
          if (typeof emailId !== "string" || !emailId || emailId.length > 255) {
            ctx.status = 400; ctx.body = { ok: false }; return;
          }
          await query.update({ where: { id: record.id }, data: {
            deliveryStatus: "sent", emailId, sentAt: new Date().toISOString(),
          } });
          ctx.body = { ok: true, sent: true }; return;
        }
        // Resend only remembers idempotency keys for 24h. Stop uncertain retries
        // after 23h; a human must reconcile pending records with the provider.
        if (record.deliveryStatus !== "sent" && Date.now() - new Date(record.createdAt).getTime() > 23 * 3600000) {
          ctx.status = 409; ctx.body = { ok: false }; return;
        }
        ctx.body = { ok: true, sent: record.deliveryStatus === "sent" };
      } catch {
        strapi.log.error("Contact submission storage failed");
        ctx.status = 503; ctx.body = { ok: false };
      }
    },
  }]);
}
