import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

export default (config) => {
  const require = createRequire(import.meta.url);
  const strapiRequire = createRequire(require.resolve("@strapi/strapi/package.json"));
  const manager = dirname(strapiRequire.resolve("@strapi/content-manager/package.json"));
  const originalEditor = join(manager, "dist/admin/pages/EditView/components/FormInputs/Wysiwyg/Field.mjs");
  if (!existsSync(originalEditor)) throw new Error("Strapi richtext editor changed: update the abbreviation adapter before building.");
  config.resolve = config.resolve || {};
  const alias = { find: "works-strapi-original-richtext", replacement: originalEditor };
  config.resolve.alias = Array.isArray(config.resolve.alias)
    ? [...config.resolve.alias, alias]
    : { ...config.resolve.alias, [alias.find]: alias.replacement };
  config.server = config.server || {};
  config.server.allowedHosts = true;
  config.server.hmr = false;
  config.server.watch = null;
  return config;
};
