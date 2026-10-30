// Development database only; fixtures are rolled back before visibility.
import assert from "node:assert/strict";
import { withStrapi } from "./translation-pipeline-lib.mjs";
await withStrapi(async app => {
  const documents = app.documents("api::career-position.career-position");
  const rollback = new Error("ROLLBACK_CAREER_FIXTURE");
  try {
    await app.db.transaction(async () => {
      const row = await documents.create({ locale: "hu", data: {
        title: "Career regression fixture", slug: `job-fixture-${Date.now()}`, isActive: false,
      } });
      const params = { documentId: row.documentId, locale: "hu" };
      await documents.publish(params);
      const first = await documents.findOne({ ...params, status: "published" });
      assert.ok(first.originalPublishedAt);
      await documents.update({ ...params, status: "published", data: { excerpt: "Edited", originalPublishedAt: "1990-01-01T00:00:00Z" } });
      assert.equal((await documents.findOne({ ...params, status: "published" })).originalPublishedAt, first.originalPublishedAt);
      await documents.unpublish(params);
      await documents.publish(params);
      assert.equal((await documents.findOne({ ...params, status: "published" })).originalPublishedAt, first.originalPublishedAt);
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  console.log("PASS career original publication survives editing and unpublish/republish; fixture rolled back");
});
