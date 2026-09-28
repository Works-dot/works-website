import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { test } from "node:test";

// Middleware is deliberately dependency-free TS (also valid JS); load the
// actual source without booting Strapi or connecting to its database.
const code = await fs.readFile(new URL("../../strapi/src/middlewares/search-indexing.ts", import.meta.url), "utf8");
const { default: createMiddleware } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
test("CMS HTML/admin is noindex; public media and API JSON are untouched", async () => {
  for (const [route, type, expected] of [
    ["/", "text/html", "noindex"],
    ["/strapi", "", "noindex"],
    ["/strapi/admin", "text/html", "noindex"],
    ["/admin/login", "application/json", "noindex"],
    ["/uploads/example.png", "image/png", undefined],
    ["/strapi/uploads/example.svg", "image/svg+xml", undefined],
    ["/api/homepage", "application/json", undefined],
  ]) {
    const headers = {};
    const ctx = { path: route, set: (key, value) => headers[key] = value };
    await createMiddleware()(ctx, async () => { ctx.type = type; });
    assert.equal(headers["X-Robots-Tag"], expected, route);
  }
});