export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacyAccepted: true;
  cvUrl?: string;
};

const CONTACT_API_URL = import.meta.env.DEV
  ? "/api/contact/send"
  : "https://works-website.replit.app/api/contact/send";

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const response = await fetch(CONTACT_API_URL, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => null)) as
    | { ok: true; code: "sent" }
    | { ok: false; code?: string }
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(result?.code || "CONTACT_SEND_FAILED");
  }
}