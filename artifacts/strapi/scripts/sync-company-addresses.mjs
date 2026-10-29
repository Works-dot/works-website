import { withStrapi } from "./translation-pipeline-lib.mjs";
import { companyImprint, OFFICE_ADDRESS, REGISTERED_ADDRESS } from "../../works-website/src/data/organization.ts";

const apply = process.argv.includes("--apply");
if (process.argv.slice(2).some(arg => !["--apply", "--dry-run"].includes(arg))) {
  throw new Error("Use --dry-run or --apply (development database only).");
}
// A scalar-only, transactional correction of both versions. Never publish a
// document: that would promote unrelated draft content and component changes.
await withStrapi(async app => {
  await app.db.transaction(async () => {
    for (const uid of ["api::global-setting.global-setting", "api::legal-document.legal-document"]) {
      const query = app.db.query(uid);
      const rows = await query.findMany({});
      for (const row of rows) {
        const data = {};
        if (uid.includes("global-setting")) {
          if (row.address !== OFFICE_ADDRESS) data.address = OFFICE_ADDRESS;
          if (row.registeredAddress !== REGISTERED_ADDRESS) data.registeredAddress = REGISTERED_ADDRESS;
        } else if (row.locale === "hu" && row.imprintBody) {
          const body = companyImprint(row.imprintBody);
          if (body !== row.imprintBody) data.imprintBody = body;
        }
        if (!Object.keys(data).length) continue;
        console.log(JSON.stringify({ uid, locale: row.locale, published: !!row.publishedAt, fields: Object.keys(data), apply }));
        if (apply) {
          // Optimistic check: don't overwrite an editor's concurrent text change.
          const where = { id: row.id, updatedAt: row.updatedAt };
          const result = await query.update({ where, data });
          if (!result) throw new Error("Concurrent edit; transaction rolled back.");
        }
      }
    }
  });
});
