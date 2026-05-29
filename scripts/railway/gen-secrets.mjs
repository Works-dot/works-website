import crypto from "node:crypto";

const key = (bytes = 16) => crypto.randomBytes(bytes).toString("base64");

const out = [
  `STRAPI_APP_KEYS=${[key(), key(), key(), key()].join(",")}`,
  `ADMIN_JWT_SECRET=${key()}`,
  `API_TOKEN_SALT=${key()}`,
  `TRANSFER_TOKEN_SALT=${key()}`,
  `JWT_SECRET=${key()}`,
];

console.log("\n# --- Fresh Strapi production secrets ---");
console.log("# Paste these into the Strapi service's Variables on Railway.");
console.log("# Generate a new set any time by re-running: node scripts/railway/gen-secrets.mjs\n");
console.log(out.join("\n"));
console.log("");
