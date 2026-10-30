import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { displayDate } from "../src/lib/display-date.js";

test("exact HU/EN dates retain the same calendar day", () => {
  assert.deepEqual(displayDate("2026-10-22", "hu"), { dateTime: "2026-10-22", text: "2026. október 22." });
  assert.deepEqual(displayDate("2026-10-22", "en"), { dateTime: "2026-10-22", text: "October 22, 2026" });
  for (const day of ["2024-02-29", "2000-02-29", "2026-01-01", "2026-12-31", "2026-03-29", "2026-10-25"]) {
    for (const locale of ["hu", "en"]) assert.equal(displayDate(day, locale).dateTime, day);
  }
  assert.equal(displayDate("2026-01-01", "hu").text, "2026. január 1.");
  assert.equal(displayDate("2026-12-31", "en").text, "December 31, 2026");
});
test("invalid and missing calendar dates never roll forward or invent a date", () => {
  for (const value of [null, undefined, "", " ", 123, "bad", "0000-01-01", "2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "2026-1-1", "2026-10-22T00:00:00Z"]) {
    for (const locale of ["hu", "en"]) assert.equal(displayDate(value, locale), null, String(value));
  }
});
test("SSR and client timezone choices cannot shift calendar days", () => {
  const url = new URL("../src/lib/display-date.js", import.meta.url).href;
  const code = `import {displayDate} from ${JSON.stringify(url)}; console.log(JSON.stringify(["2026-01-01","2026-03-29","2026-10-25"].flatMap(d=>["hu","en"].map(l=>displayDate(d,l)))));`;
  const results = ["UTC", "Europe/Budapest", "America/Los_Angeles", "Pacific/Kiritimati"].map(TZ =>
    execFileSync(process.execPath, ["--input-type=module", "-e", code], { env: { ...process.env, TZ }, encoding: "utf8" }));
  for (const result of results) assert.equal(result, results[0]);
});
