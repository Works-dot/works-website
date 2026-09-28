import assert from "node:assert/strict";
import test from "node:test";
import {
  getVariantWidths,
  hashSourceTransform,
  isRasterSource,
  safeName,
} from "./optimize-images.mjs";

test("only static raster sources are eligible for WebP variants", () => {
  assert.equal(isRasterSource("/strapi/uploads/photo.png"), true);
  assert.equal(isRasterSource("/strapi/uploads/photo.jpeg"), true);
  assert.equal(isRasterSource("/strapi/uploads/animation.gif"), false);
  assert.equal(isRasterSource("/strapi/uploads/illustration.svg"), false);
});

test("variant widths never advertise pixels larger than the source", () => {
  assert.deepEqual(getVariantWidths(246), [246]);
  assert.deepEqual(getVariantWidths(1280), [320, 480, 768, 1200, 1280]);
  assert.deepEqual(getVariantWidths(1920), [320, 480, 768, 1200, 1600, 1920]);
});

test("variant names include the source and transform hash", () => {
  const source = "/strapi/uploads/photo.png";
  assert.notEqual(hashSourceTransform(source, 320), hashSourceTransform(source, 768));
  assert.notEqual(
    hashSourceTransform(source, 320),
    hashSourceTransform("/strapi/uploads/other.png", 320),
  );
  assert.equal(safeName("photo with spaces.png"), "photo-with-spaces.png");
});