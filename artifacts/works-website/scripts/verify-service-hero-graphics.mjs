import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(root, "..", "..");
const manifestPath = path.join(root, "src", "data", "service-hero-graphics.json");
const cachePath = path.join(root, "src", "data", "strapi-cache.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const graphics = manifest.graphics ?? {};
const slugMap = manifest.slugs ?? {};
const localizedDatasets = cache.hu && cache.en
  ? [["hu", cache.hu], ["en", cache.en]]
  : [["hu", cache]];
const servicesByLocale = localizedDatasets.map(([locale, dataset]) => [
  locale,
  Array.isArray(dataset?.services) ? dataset.services : [],
]);

for (const [locale, services] of servicesByLocale) {
  assert.ok(
    services.length > 0,
    `No published ${locale.toUpperCase()} services were found in the Strapi cache`,
  );
}

for (const [key, filename] of Object.entries(graphics)) {
  assert.equal(typeof filename, "string", `Hero graphic "${key}" has no asset filename`);
  assert.ok(
    fs.existsSync(path.join(workspaceRoot, "attached_assets", filename)),
    `Hero graphic asset is missing: ${filename}`,
  );
}

const assignmentsByLocale = servicesByLocale.map(([locale, services]) => [
  locale,
  services.map((service) => {
    const slug = service?.slug;
    assert.ok(slug, `A published ${locale.toUpperCase()} service has no slug`);

    const graphicKey = slugMap[slug];
    assert.ok(
      graphicKey,
      `Published ${locale.toUpperCase()} service "${slug}" would use the generic fallback hero`,
    );
    assert.ok(
      Object.hasOwn(graphics, graphicKey),
      `Published ${locale.toUpperCase()} service "${slug}" references unknown hero graphic "${graphicKey}"`,
    );

    return { slug, graphicKey, filename: graphics[graphicKey] };
  }),
]);

for (const [locale, assignments] of assignmentsByLocale) {
  const duplicateAssignments = assignments.filter(
    (assignment, index) =>
      assignments.findIndex((candidate) => candidate.graphicKey === assignment.graphicKey) !== index,
  );
  assert.deepEqual(
    duplicateAssignments,
    [],
    `Published ${locale.toUpperCase()} services must use distinct hero graphics: ${duplicateAssignments
      .map(({ slug, graphicKey }) => `${slug} → ${graphicKey}`)
      .join(", ")}`,
  );

  console.log(
    `✓ ${assignments.length} published ${locale.toUpperCase()} service hero graphic(s) verified`,
  );
  for (const { slug, filename } of assignments) {
    console.log(`  ${slug} → ${filename}`);
  }
}