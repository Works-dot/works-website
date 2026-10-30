import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("clean dev preview uses originals and dimensions without generated media", async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "image-preview-"));
  let server;
  try {
    for (const relative of ["src/components/ui/ResponsiveImage.tsx", "src/data/image-manifest.ts", "src/data/image-manifest-types.ts"]) {
      await fs.mkdir(path.dirname(path.join(temp, relative)), { recursive: true });
      await fs.copyFile(path.join(root, relative), path.join(temp, relative));
    }
    server = await createServer({ configFile: false, root: temp, logLevel: "error",
      resolve: { alias: { "@": path.join(temp, "src") } },
      server: { middlewareMode: true }, appType: "custom" });
    const manifest = (await server.ssrLoadModule("/src/data/image-manifest.ts")).default;
    const { getResponsiveImageSource } = await server.ssrLoadModule("/src/components/ui/ResponsiveImage.tsx");
    for (const [key, image] of Object.entries(manifest)) {
      const source = key.startsWith("local:") ? image.source : key;
      const result = getResponsiveImageSource(source);
      assert.ok(result, source);
      assert.equal(result.src, source);
      assert.equal(result.srcSet, "");
      assert.ok(result.width > 0 && result.height > 0, source);
    }
    await assert.rejects(fs.access(path.join(temp, "public/media")));
  } finally {
    await server?.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
});
