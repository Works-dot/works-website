export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacyAccepted: true;
  cvUrl?: string;
  referralSource?: string;
};

// Use the website's own server, including on the public custom domain.
const CONTACT_API_URL = `${import.meta.env.BASE_URL}api/contact/send`;

// Keep the same key after a network failure, without persisting form data in storage.
let lastSubmission: { body: string; id: string } | undefined;

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const body = JSON.stringify(payload);
  if (lastSubmission?.body !== body) {
    lastSubmission = { body, id: crypto.randomUUID() };
  }
  const response = await fetch(CONTACT_API_URL, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, submissionId: lastSubmission.id }),
  });
  const result = (await response.json().catch(() => null)) as
    | { ok: true; code: "sent" }
    | { ok: false; code?: string }
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(result?.code || "CONTACT_SEND_FAILED");
  }
  lastSubmission = undefined;
}