import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { pendingLegalRedirect, PENDING_EN_LEGAL } from "../legal-redirects.mjs";
import { buildLegacyRedirects } from "../legacy-redirects.mjs";

test("pending English legal URLs use temporary, nonindexable redirects, preserving query", () => {
  for (const [source, target] of Object.entries(PENDING_EN_LEGAL)) {
    for (const method of ["GET", "HEAD"]) {
      for (const slash of ["", "/"]) {
        let ended = false;
        pendingLegalRedirect({ method, url: source + slash + "?x=1&x=2" }, {
          writeHead(status, headers) {
            assert.equal(status, 302);
            assert.equal(headers.Location, target + "?x=1&x=2");
            assert.equal(headers["X-Robots-Tag"], "noindex");
            assert.equal(headers["Cache-Control"], "no-store");
          },
          end() { ended = true; },
        }, () => assert.fail("Unexpected fallthrough"));
        assert.ok(ended);
      }
    }
  }
});
test("temporary redirects do not catch unrelated routes or methods", () => {
  for (const request of [{ method: "POST", url: "/en/privacy" }, { method: "GET", url: "/en/privacy/other" }]) {
    let next = false;
    pendingLegalRedirect(request, {}, () => { next = true; });
    assert.ok(next);
  }
});
test("legal legacy routes are direct HTML destinations", () => {
  const redirects = buildLegacyRedirects();
  assert.equal(Object.keys(redirects).length, 29);
  assert.equal(redirects["/imprint"], "https://www.worksdot.hu/impresszum");
  assert.equal(redirects["/terms"], redirects["/imprint"]);
});
test("HU authoritative payload has all six fields and no generated line citations", () => {
  const payload = JSON.parse(fs.readFileSync(new URL("../../strapi/src/seed-documents/legal-hu.json", import.meta.url)));
  for (const kind of ["privacy", "cookie", "imprint"]) {
    assert.ok(payload[`${kind}Title`]);
    assert.ok(payload[`${kind}Body`].length > 500);
    assert.doesNotMatch(payload[`${kind}Body`], /\[L\d/);
  }
  assert.match(payload.cookieBody, /`_ga_<azonosító>`/);
  assert.match(payload.privacyBody, /2026\.09\.01\./);
  assert.match(payload.imprintBody, /HU82 1160 0006 0000 0000 7615 9264/);
});