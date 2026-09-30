---
name: Mailchimp newsletter delivery
description: Why the Works. newsletter uses a Replit-hosted OAuth bridge instead of API keys or Mailchimp's hosted form.
---

The Railway-hosted frontend must send newsletter subscriptions to the public Replit website deployment, which performs the Mailchimp upsert through the Replit Mailchimp OAuth connector. Keep signup single opt-in and idempotent.

**Why:** Mailchimp rejected a correctly formatted direct Marketing API key even after data-center and runtime checks. The hosted form path triggered human verification and cannot serve as a backend integration. Replit's OAuth connection was verified to read and write the Newsletter audience, but its credentials are only available in Replit runtimes, not Railway.

**How to apply:** Keep Mailchimp credentials server-side, use the OAuth connector in Replit-hosted endpoints, and have external deployments call the stable public Replit endpoint. Do not return to API-key or hosted-form submission unless Mailchimp's authentication model changes and is re-verified end to end.

Deleting a Mailchimp member only archives it; use the permanent-delete action when the member must be removed completely.

**Why:** The normal delete endpoint can return success while the member remains retrievable.

**How to apply:** For temporary members, call permanent delete and require a `404` lookup before considering cleanup complete.