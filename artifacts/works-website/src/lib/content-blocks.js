export function strapiImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `/strapi${url}`;
}

export function mapContentBlocks(blocks) {
  if (!blocks) return [];
  return blocks.map((b) => {
    if (b.__component === "content.text-block") {
      return { type: "text", content: b.body || "" };
    }
    if (b.__component === "content.highlight-block") {
      return { type: "highlight", content: b.quote || "" };
    }
    if (b.__component === "content.image-block") {
      return {
        type: "image",
        content: strapiImageUrl(b.image?.url),
        caption: b.caption,
      };
    }
    return { type: "text", content: "" };
  });
}
