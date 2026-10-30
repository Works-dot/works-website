import { test } from "node:test";
import assert from "node:assert/strict";
import { planAuthorBackfill } from "../src/article-author-backfill.ts";
test("only same-document published identity repairs legacy missing relations", () => {
  const source={id:1,documentId:"article",locale:"hu",publishedAt:"date",author:{documentId:"person"}};
  const target={id:2,documentId:"article",locale:"en",publishedAt:"date",authorMode:null};
  const member={id:12,documentId:"person",locale:"en",publishedAt:"date"};
  assert.deepEqual(planAuthorBackfill([source,target],[member]),[{id:2,author:12}]);
  for(const change of [{authorMode:"manual"},{authorMode:"colleague"},{author:{documentId:"other"}},{documentId:"different"}]){
    assert.deepEqual(planAuthorBackfill([source,{...target,...change}],[member]),[]);
  }
  assert.deepEqual(planAuthorBackfill([source,target],[{...member,publishedAt:null}]),[]);
  assert.deepEqual(planAuthorBackfill([{...source,publishedAt:null},target],[member]),[]);
});
