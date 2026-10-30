import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
let vite, Card, Provider;
before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)), configFile: false,
    esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
    server: { middlewareMode:true, hmr:false }, appType:"custom",
  });
  Card = (await vite.ssrLoadModule("/src/components/ArticleAuthorCard.tsx")).ArticleAuthorCard;
  Provider = (await vite.ssrLoadModule("/src/i18n/context.tsx")).I18nProvider;
});
after(async()=>{await vite?.close();});
const render = (author,locale="hu") => renderToStaticMarkup(createElement(Provider,{locale},
  createElement(Card,{post:{author:author?.name||"",authorDetails:author}})));
test("empty and partial author cards have no placeholders",()=>{
  assert.equal(render(null),"");
  const name=render({name:"Test author",worksFor:false});
  assert.ok(name.includes("Test author"));
  assert.ok(!name.includes("<img") && !name.includes("<a "));
  for(const details of [{jobTitle:"Designer"},{image:"/portrait.jpg"},{bio:"Short bio"}]){
    const markup=render({name:"Test author",worksFor:false,...details});
    assert.ok(markup.includes(Object.values(details)[0]));
    assert.ok(!markup.includes("undefined"));
  }
});
test("full EN author has safe link and localized accessible new-tab label",()=>{
  const markup=render({name:"Test author",jobTitle:"Designer",image:"/portrait.jpg",bio:"Short bio",
    linkedinUrl:"https://linkedin.com/in/test-author",worksFor:true},"en");
  for(const part of ["About the author","opens in a new tab",'target="_blank"','rel="noopener noreferrer"',"Designer","Short bio"]) assert.ok(markup.includes(part));
});
