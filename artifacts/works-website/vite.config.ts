import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { subscribeNewsletter } from "./newsletter-server.mjs";

const rawPort = process.env.PORT;

const port = rawPort ? Number(rawPort) : undefined;

if (rawPort !== undefined && (Number.isNaN(port) || (port as number) <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    {
      name: "admin-redirect",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url === "/admin" || req.url.startsWith("/admin/"))) {
            res.writeHead(302, { Location: "/strapi" + req.url });
            res.end();
            return;
          }
          next();
        });
      },
    },
    {
      name: "newsletter-api",
      configureServer(server) {
        server.middlewares.use("/api/newsletter/subscribe", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, code: "method_not_allowed" }));
            return;
          }

          try {
            const chunks: Buffer[] = [];
            let totalSize = 0;

            for await (const chunk of req) {
              const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              totalSize += buffer.length;
              if (totalSize > 10 * 1024) {
                res.statusCode = 413;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, code: "request_too_large" }));
                return;
              }
              chunks.push(buffer);
            }

            const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
            const result = await subscribeNewsletter(body.email);
            res.statusCode = result.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.body));
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, code: "invalid_request" }));
          }
        });
      },
    },
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
