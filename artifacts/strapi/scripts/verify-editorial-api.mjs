// Local development only. Credentials remain in memory and are never logged.
import assert from "node:assert/strict";
const base = "http://127.0.0.1:8099";
const login = await fetch(`${base}/admin/login`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:process.env.STRAPI_ADMIN_EMAIL,password:process.env.STRAPI_ADMIN_PASSWORD})});
if (!login.ok) throw Error(`Local admin login: ${login.status}`);
const {data:{token}} = await login.json();
const headers = {Authorization:`Bearer ${token}`};
const ids=[];
const prefix=`editorial-test-${Date.now()}`;
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAE0lEQVR4nGP4z8DwnwGM/zMwAAAf7gP9NRsAMwAAAABJRU5ErkJggg==","base64");
async function upload(infos, replaceId) {
  const form=new FormData();
  for (let i=0;i<infos.length;i++) form.append("files",new Blob([png],{type:"image/png"}),`${prefix}-${i}.png`);
  const named=infos.map((info,i)=>({name:`${prefix}-${i}.png`,...info}));
  form.append("fileInfo",JSON.stringify(named.length===1?named[0]:named));
  const r=await fetch(`${base}/upload${replaceId?`?id=${replaceId}`:""}`,{method:"POST",headers,body:form});
  const body=await r.json();
  if(r.ok && !replaceId) for(const file of body) ids.push(file.id);
  return {status:r.status,body};
}
async function info(id, data) {
  const r=await fetch(`${base}/upload?id=${id}`,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({fileInfo:data})});
  return {status:r.status,body:await r.json()};
}
try {
  assert.equal((await upload([{}])).status,400);
  assert.equal((await upload([{alternativeText:"   "}])).status,400);
  assert.equal((await upload([{alternativeText:"valid"},{}])).status,400);
  const valid=await upload([{alternativeText:"Teszt ábra"}]);
  assert.equal(valid.status,201,JSON.stringify(valid.body));
  const id=valid.body[0].id;
  assert.equal(valid.body[0].alternativeText,"Teszt ábra");
  assert.equal((await info(id,{alternativeText:"",decorative:false})).status,400);
  assert.equal((await upload([{alternativeText:"",decorative:false}],id)).status,400);
  const decorative=await info(id,{decorative:true,alternativeText:"old"});
  assert.equal(decorative.status,200,JSON.stringify(decorative.body));
  assert.equal(decorative.body.decorative,true);
  assert.equal(decorative.body.alternativeText,"");
  assert.equal((await info(id,{decorative:false,alternativeText:""})).status,400);
  const created=await upload([{decorative:true}]);
  assert.equal(created.status,201,JSON.stringify(created.body));
  assert.equal(created.body[0].decorative,true);
  assert.equal(created.body[0].alternativeText,"");
  console.log("PASS: blank/mixed uploads, metadata and replacement rejected; valid and decorative persisted.");
} finally {
  for(const id of ids) {
    const r=await fetch(`${base}/upload/files/${id}`,{method:"DELETE",headers});
    assert.ok(r.ok,`Cleanup failed for temporary file ${id}`);
  }
  console.log(`Cleaned ${ids.length} temporary local media records.`);
}
