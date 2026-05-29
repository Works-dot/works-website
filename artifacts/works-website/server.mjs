import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist", "public");

const PORT = Number(process.env.PORT) || 8080;
const STRAPI_TARGET = process.env.STRAPI_URL || process.env.STRAPI_PROXY_TARGET;

if (!STRAPI_TARGET) {
  throw new Error(
    "STRAPI_URL (or STRAPI_PROXY_TARGET) environment variable is required — it must point to the Strapi service base URL.",
  );
}

if (!fs.existsSync(distDir)) {
  throw new Error(
    `Static build not found at ${distDir}. Run the build step before starting the server.`,
  );
}

const app = express();

app.disable("x-powered-by");

app.use(
  createProxyMiddleware({
    pathFilter: (pathname) => pathname === "/strapi" || pathname.startsWith("/strapi/"),
    target: STRAPI_TARGET,
    changeOrigin: true,
    xfwd: true,
  }),
);

app.use(
  express.static(distDir, {
    extensions: ["html"],
    index: "index.html",
  }),
);

app.get(/.*/, (req, res) => {
  const candidate = path.join(distDir, req.path, "index.html");
  res.sendFile(candidate, (err) => {
    if (err) {
      res.sendFile(path.join(distDir, "index.html"));
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Works. website serving on :${PORT}`);
  console.log(`  static: ${distDir}`);
  console.log(`  proxy: /strapi/* -> ${STRAPI_TARGET}`);
});
