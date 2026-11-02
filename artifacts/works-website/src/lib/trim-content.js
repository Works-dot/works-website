const titleField = key => /^(title|name|heading|slug|metaTitle|metaDescription|seoTitle|seoDescription)$/.test(key) ||
  /(?:Title|Heading)$/.test(key);

/** Normalize only named plain-text fields, not rich text or arbitrary strings. */
export function trimContent(value) {
  if (Array.isArray(value)) return value.map(trimContent);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    typeof item === "string" && titleField(key) ? item.trim() :
      // Preserve rich-text bodies, including text nodes whose whitespace is meaningful.
      ["content", "body", "richText", "blocks"].includes(key) ? item : trimContent(item),
  ]));
}
