// Real Strapi document-service regression, development DB only.
// Everything (including publications) is rolled back before becoming visible.
import assert from "node:assert/strict";
import { withStrapi } from "./translation-pipeline-lib.mjs";
import { articleDates } from "../../works-website/src/lib/article-dates.js";

await withStrapi(async app => {
  const uid = "api::blog-post.blog-post";
  const documents = app.documents(uid);
  const rollback = new Error("ROLLBACK_DATE_FIXTURES");
  const ids = [];
  try {
    await app.db.transaction(async () => {
      for (const date of ["2020-02-03", undefined]) {
        const created = await documents.create({ locale:"hu", data:{
          title:"Publication regression fixture", slug:`publication-regression-${Date.now()}`,
          ...(date ? {date} : {}),
        }});
        ids.push(created.documentId);
        const params={documentId:created.documentId,locale:"hu"};
        await documents.publish(params);
        const first=await documents.findOne({...params,status:"published"});
        assert.ok(first.originalPublishedAt);
        if(date)assert.equal(first.originalPublishedAt,"2020-02-03T00:00:00.000Z");
        await documents.update({...params,data:{excerpt:"Edited after publication",originalPublishedAt:"1990-01-01T00:00:00.000Z"}});
        // Draft editing must not change the live metadata yet.
        assert.equal((await documents.findOne({...params,status:"published"})).updatedAt,first.updatedAt);
        await documents.publish(params);
        const second=await documents.findOne({...params,status:"published"});
        assert.equal(second.originalPublishedAt,first.originalPublishedAt);
        assert.ok(Date.parse(second.updatedAt)>Date.parse(first.updatedAt));
        assert.equal(articleDates(second).publishedTime,articleDates(first).publishedTime);
        assert.equal(articleDates(second).modifiedTime,new Date(second.updatedAt).toISOString());
        await documents.unpublish(params);
        await documents.publish(params);
        assert.equal((await documents.findOne({...params,status:"published"})).originalPublishedAt,first.originalPublishedAt);
      }
      const direct=await documents.create({locale:"en",status:"published",data:{
        title:"Direct publication fixture",slug:`direct-publication-${Date.now()}`,
      }});
      ids.push(direct.documentId);
      const directParams={documentId:direct.documentId,locale:"en",status:"published"};
      const directFirst=await documents.findOne(directParams);
      assert.ok(directFirst.originalPublishedAt);
      await documents.update({...directParams,data:{excerpt:"Direct published update"}});
      assert.equal((await documents.findOne(directParams)).originalPublishedAt,directFirst.originalPublishedAt);
      // A legacy published record with no originalPublishedAt captures its OLD
      // publication time, not its new republish time.
      const id=ids[1], old="2021-04-05T06:07:08.000Z";
      await app.db.query(uid).updateMany({where:{documentId:id},data:{originalPublishedAt:null}});
      const legacy=await documents.findOne({documentId:id,locale:"hu",status:"published"});
      await app.db.query(uid).update({where:{id:legacy.id},data:{publishedAt:old}});
      await documents.publish({documentId:id,locale:"hu"});
      assert.equal((await documents.findOne({documentId:id,locale:"hu",status:"published"})).originalPublishedAt,old);
      throw rollback;
    });
  } catch(error) { if(error!==rollback)throw error; }
  assert.equal(await app.db.query(uid).count({where:{documentId:{$in:ids}}}),0);
  console.log("PASS: edit/republish updates modified time, preserves publication; unpublish/republish and legacy data covered. All fixtures rolled back.");
});
