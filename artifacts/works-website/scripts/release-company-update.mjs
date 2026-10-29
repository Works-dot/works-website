// Release completed contact/address work onto current GitHub main without
// replacing later, remote-only blog/analytics changes.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve(import.meta.dirname, "../../..");
const dir = "/tmp/works-company-release";
const repo = "/repos/Works-dot/works-website";
const client = new ReplitConnectors();
async function api(url, method="GET", data) {
  const r = await client.proxy("github", url, { method, headers: { "Content-Type": "application/json" }, ...(data ? { body: JSON.stringify(data) } : {}) });
  if (!r.ok) throw Error(`${method} ${url}: ${r.status}`);
  const result = await r.json();
  if (result.errors?.length) throw Error(JSON.stringify(result.errors));
  return result;
}
const hash = content => crypto.createHash("sha256").update(content).digest("hex");
const git = args => execFileSync("git", args, { cwd: root, encoding:"utf8" }).trim();
const base = "dfd524d";
if (process.argv.includes("--prepare")) {
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const head = (await api(`${repo}/git/ref/heads/main`)).object.sha;
  const tree = (await api(`${repo}/git/commits/${head}`)).tree.sha;
  const entries = (await api(`${repo}/git/trees/${tree}?recursive=1`)).tree;
  const paths = [...new Set([
    ...git(["diff","--name-only",base,"HEAD"]).split("\n"),
    ...git(["diff","--name-only"]).split("\n"),
    ...git(["ls-files","--others","--exclude-standard"]).split("\n"),
  ])].filter(p=>/^artifacts\/(strapi|works-website|api-server)\//.test(p) && !p.includes("/docs/"));
  const plan=[];
  const conflicts=[];
  for(const p of paths){
    if(!fs.existsSync(path.join(root,p))) throw Error(`Unreviewed deletion: ${p}`);
    const local=fs.readFileSync(path.join(root,p),"utf8");
    const old=spawnSync("git",["show",`${base}:${p}`],{cwd:root,encoding:"utf8"});
    const remoteEntry=entries.find(e=>e.path===p);
    let content=local;
    if(remoteEntry){
      const blob=await api(`${repo}/git/blobs/${remoteEntry.sha}`);
      const remote=Buffer.from(blob.content,"base64").toString();
      if(old.status!==0 && remote!==local) throw Error(`Conflicting new file ${p}`);
      if(old.status===0){
        const prefix=path.join(dir,hash(p));
        fs.writeFileSync(prefix+".local",local);fs.writeFileSync(prefix+".base",old.stdout);fs.writeFileSync(prefix+".remote",remote);
        const merged=spawnSync("git",["merge-file","-p",prefix+".local",prefix+".base",prefix+".remote"],{encoding:"utf8"});
        content=merged.stdout;
        if (merged.status !== 0 && p === "artifacts/strapi/src/index.ts") {
          // Reviewed additive conflicts: retain both independent migrations.
          content = content.replace(/<<<<<<<[^\n]*\n(import \{ migrateCompanyAddresses \}[^\n]*\n)=======\n(import \{ migrateHuBlogSlugs \}[^\n]*\n)>>>>>>>[^\n]*\n/g, "$1$2")
            .replace(/<<<<<<<[^\n]*\n(    await migrateCompanyAddresses\(strapi\);\n)=======\n(    \/\/ Complete the reviewed slug-only migration before serving CMS requests\.\n    await migrateHuBlogSlugs\(strapi\);\n)>>>>>>>[^\n]*\n/g, "$1$2");
        }
        if (content.includes("<<<<<<<") || content.includes(">>>>>>>")) conflicts.push(p);
      }
      if(content===remote) continue;
    }
    const target=path.join(dir,"candidate",p);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,content);
    plan.push({path:p,mode:remoteEntry?.mode||"100644",localHash:hash(local),candidateHash:hash(content)});
  }
  fs.writeFileSync(path.join(dir,"plan.json"),JSON.stringify({head,tree,plan,conflicts},null,2));
  console.log(JSON.stringify({head,files:plan.map(p=>p.path),conflicts},null,2));
} else if(process.argv.includes("--apply")){
  const {head,tree,plan,conflicts}=JSON.parse(fs.readFileSync(path.join(dir,"plan.json")));
  if(conflicts.length) throw Error("Resolve and review candidate conflicts first");
  const current=(await api(`${repo}/git/ref/heads/main`)).object.sha;
  if(current!==head)throw Error("GitHub main changed; prepare again");
  const treeEntries=[];
  for(const entry of plan){
    if(hash(fs.readFileSync(path.join(root,entry.path)))!==entry.localHash)throw Error(`Local changed: ${entry.path}`);
    const content=fs.readFileSync(path.join(dir,"candidate",entry.path));
    if(hash(content)!==entry.candidateHash)throw Error(`Candidate changed: ${entry.path}`);
    const blob=await api(`${repo}/git/blobs`,"POST",{encoding:"base64",content:content.toString("base64")});
    const expected=crypto.createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex");
    if(blob.sha!==expected)throw Error("Blob mismatch");
    treeEntries.push({path:entry.path,mode:entry.mode,type:"blob",sha:blob.sha});
  }
  const next=await api(`${repo}/git/trees`,"POST",{base_tree:tree,tree:treeEntries});
  const commit=await api(`${repo}/git/commits`,"POST",{message:"Release contact referral and canonical company addresses with automatic safe CMS migration",tree:next.sha,parents:[head]});
  const info=await api(repo);
  await api("/graphql","POST",{query:"mutation($input:UpdateRefsInput!){updateRefs(input:$input){clientMutationId}}",variables:{input:{repositoryId:info.node_id,refUpdates:[{name:"refs/heads/main",beforeOid:head,afterOid:commit.sha,force:false}]}}});
  if((await api(`${repo}/git/ref/heads/main`)).object.sha!==commit.sha)throw Error("Head verification failed");
  console.log(`VERIFIED MAIN ${commit.sha}`);
} else throw Error("Use --prepare or --apply");
