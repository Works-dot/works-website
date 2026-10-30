import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  getVariantWidths,
  hashSourceTransform,
  isRasterSource,
  safeName,
  renderVariant,
} from "./optimize-images.mjs";

test("only static raster sources are eligible for WebP variants", () => {
  assert.equal(isRasterSource("/strapi/uploads/photo.png"), true);
  assert.equal(isRasterSource("/strapi/uploads/photo.jpeg"), true);
  assert.equal(isRasterSource("/strapi/uploads/animation.gif"), false);
  assert.equal(isRasterSource("/strapi/uploads/illustration.svg"), false);
});

test("WebP preserves aspect ratio, transparency and EXIF orientation without enlargement", async () => {
  const png = await sharp({ create: { width: 640, height: 320, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
  const small = await sharp(await renderVariant(png, 320)).metadata();
  assert.equal(small.width, 320);
  assert.equal(small.height, 160);
  assert.equal(small.hasAlpha, true);
  const large = await sharp(await renderVariant(png, 1280)).metadata();
  assert.equal(large.width, 640);
  const rotated = await sharp(png).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const portrait = await sharp(await renderVariant(rotated, 160)).metadata();
  assert.equal(portrait.width, 160);
  assert.equal(portrait.height, 320);
});

test("variant widths never advertise pixels larger than the source", () => {
  assert.deepEqual(getVariantWidths(246), [64, 128, 192, 246]);
  assert.deepEqual(getVariantWidths(1280), [64, 128, 192, 320, 480, 768, 1200, 1280]);
  assert.deepEqual(getVariantWidths(1920), [64, 128, 192, 320, 480, 768, 1200, 1600, 1920]);
});

test("variant names include the source and transform hash", () => {
  const source = "/strapi/uploads/photo.png";
  assert.notEqual(hashSourceTransform(source, 320), hashSourceTransform(source, 768));
  assert.notEqual(
    hashSourceTransform(source, 320),
    hashSourceTransform("/strapi/uploads/other.png", 320),
  );
  assert.equal(safeName("photo with spaces.png"), "photo-with-spaces.png");
  assert.notEqual(hashSourceTransform(source, 320, Buffer.from("old")), hashSourceTransform(source, 320, Buffer.from("new")));
});