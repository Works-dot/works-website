---
name: Strapi dev port-conflict recovery
description: How to recover when the Strapi workflow fails with "port 8099 already used".
---

The Strapi dev workflow occasionally dies with "The port 8099 is already used by another application" because a previous `strapi develop` process survives a workflow restart and keeps the port. The stale process still answers requests, so a 200 from the API does NOT mean the managed workflow is healthy — check the workflow status, not just curl.

**How to apply:** `fuser` does not exist in this environment (it exits "command not found" but a `2>/dev/null` redirect hides it — the cleanup silently no-ops). Find PIDs with `ps aux | grep strapi` (kill the pnpm wrapper AND the strapi.js processes), `kill` them, verify the port is free (e.g. python socket connect), then restart the workflow.
