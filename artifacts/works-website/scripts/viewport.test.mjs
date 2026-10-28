import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("shared HU/EN and 404 template allows mobile zoom", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const viewports = html.match(/<meta\b[^>]*name=["']viewport["'][^>]*>/gi) || [];
  assert.equal(viewports.length, 1);
  assert.match(viewports[0], /content="width=device-width, initial-scale=1"/);
  assert.doesNotMatch(viewports[0], /maximum-scale|user-scalable/i);
});
