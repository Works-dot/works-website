import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveArticleAuthor, articleAuthor, linkedinProfile, personSchema, fetchAuthorResponse } from "../src/lib/article-author.js";

test("colleague and manual sources never mix; clear removes data", () => {
  const colleague = { name:"Existing Author", title:"Designer", image:{ url:"/photo.jpg" }, bio:"Bio", linkedinUrl:"https://www.linkedin.com/in/example/" };
  const author = resolveArticleAuthor({ author:colleague });
  assert.equal(author.name,colleague.name);
  assert.equal(author.jobTitle,"Designer");
  assert.equal(author.worksFor,true);
  const manual=resolveArticleAuthor({ author:colleague, authorMode:"manual", manualAuthor:{name:"Guest"} });
  assert.equal(manual.name,"Guest"); assert.equal(manual.image,""); assert.equal(manual.jobTitle,"");
  assert.equal(manual.worksFor,false);
  assert.equal(resolveArticleAuthor({author:colleague,authorMode:"manual",manualAuthor:{}}),null);
  assert.equal(resolveArticleAuthor({author:null}),null);
  assert.equal(articleAuthor({author:"Old",authorDetails:null}),null);
  assert.deepEqual(articleAuthor({author:"Old"}),{name:"Old",worksFor:false});
});
test("schema has real values, absolute image and stable Organization reference", () => {
  const author=resolveArticleAuthor({author:{name:"Existing Author",title:"Designer",image:{url:"/photo.jpg"},linkedinUrl:"https://linkedin.com/in/example"}});
  const schema=personSchema(author,v=>`https://example.org${v}`,"https://example.org/#organization");
  assert.deepEqual(schema,{"@type":"Person",name:"Existing Author",jobTitle:"Designer",image:"https://example.org/photo.jpg",sameAs:["https://linkedin.com/in/example"],worksFor:{"@id":"https://example.org/#organization"}});
  assert.deepEqual(personSchema({name:"Guest",worksFor:false},v=>v,"org"),{"@type":"Person",name:"Guest"});
  assert.equal(personSchema(null,v=>v,"org"),undefined);
});
test("optional data combinations and unsafe links", () => {
  for(const fields of [{},{title:"Designer"},{image:{url:"/photo.jpg"}},{bio:"Short bio"}]){
    const a=resolveArticleAuthor({author:{name:"Author",...fields}});
    assert.equal(a.name,"Author");
  }
  for(const url of ["javascript:alert(1)","https://linkedin.com.evil.test/in/person","https://evil@linkedin.com/in/person","http://linkedin.com/in/person","https://linkedin.com/company/example",""]) assert.equal(linkedinProfile(url),"");
});
test("old schema fallback is narrowly scoped and preserves locale and filters", async () => {
  const calls=[];
  await fetchAuthorResponse(async url=>{
    calls.push(String(url));
    return calls.length===1 ? new Response(JSON.stringify({error:{message:"Invalid key manualAuthor"}}),{status:400}) : new Response('{"data":[]}');
  },"https://example.org/api/blog-posts?locale=en&filters[slug][$eq]=test&populate[0]=author.image&populate[5]=manualAuthor.image");
  assert.equal(calls.length,2);
  const u=new URL(calls[1]);assert.equal(u.searchParams.get("locale"),"en");assert.equal(u.searchParams.get("filters[slug][$eq]"),"test");assert.equal(u.searchParams.get("populate[5]"),null);
  let count=0;
  const response=await fetchAuthorResponse(async()=>{count++;return new Response(JSON.stringify({error:{message:"Other failure"}}),{status:400});},"https://example.org/?populate[5]=manualAuthor.image");
  assert.equal(count,1);assert.equal(response.status,400);
});
