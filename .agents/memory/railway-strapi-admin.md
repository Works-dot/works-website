---
name: Railway Strapi admin login & DB origin
description: How the Railway (prod) Strapi admin relates to the Replit (dev) one, and how to reset/create the prod admin without losing content.
---

## DB origin (corrects a common wrong assumption)
- The Replit (dev) Strapi and the Railway (prod) Strapi use **separate** Postgres databases.
- BUT Railway's DB was **seeded from a `pg_dump` of the dev `strapi` schema** at migration time (`scripts/railway/dump-strapi-db.sh` → `restore-strapi-db.sh`, full schema incl. `admin_users`).
- **Implication:** at migration time the admin email + password hash were IDENTICAL on both. They can DRIFT afterwards (a password reset on one side does not propagate). So "I can log into dev but Railway says invalid credentials" usually means the password was changed on one side after the dump — NOT that the DBs were never linked.

## Resetting / creating the Railway admin (no content loss)
- Env-gated bootstrap `resetAdminFromEnv(strapi)` in `artifacts/strapi/src/index.ts` (runs first in `bootstrap`).
  - Reads `ADMIN_RESET_EMAIL` + `ADMIN_RESET_PASSWORD` (plain, min 8 chars). No-op if unset → safe for dev/local.
  - Finds admin by email: if exists → `strapi.service('admin::user').updateById(id, {password, isActive, blocked:false})`; else creates a super-admin (`updateById`/`create` hash the password automatically via the auth service).
  - Touches ONLY `admin_users` — never content.
- **Why env-gated bootstrap (not a CLI reset):** no shell access to the Railway container from Replit; the user already knows the GitHub-push → Railway-redeploy → set-Railway-variable flow. Reuses it.
- **User flow:** push code to GitHub `main` → Railway redeploys Strapi → user sets the 2 vars on the **Strapi** service → reboot creates/resets admin → log in → **remove the 2 vars** afterwards.
- Var names deliberately have NO `RAILWAY_` prefix (Railway hides user vars with that prefix — see railway-deploy.md).

## ADMIN_JWT_SECRET is NOT the password
- It's the key Strapi uses to sign admin session tokens. Changing it logs sessions out but never causes "invalid credentials" on login (that's the bcrypt password check). Unrelated to login passwords.
