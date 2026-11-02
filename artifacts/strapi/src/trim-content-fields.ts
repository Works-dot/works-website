const isTitle = (key: string) => /^(title|name|heading|slug|metaTitle|metaDescription|seoTitle|seoDescription)$/.test(key) ||
  /(?:Title|Heading)$/.test(key);

// Work only on attributes actually supplied in the write. Do not reconstruct
// components or traverse media/relations: Strapi owns those update semantics.
export function trimContentFields(data: any, schema: any, components: Record<string, any>): any {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const result = { ...data };
  for (const [key, attr] of Object.entries<any>(schema?.attributes || {})) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    if (["string", "text", "uid"].includes(attr.type) && isTitle(key) && typeof value === "string") {
      result[key] = value.trim();
    } else if (attr.type === "component") {
      const trim = (item: any) => trimContentFields(item, components[attr.component], components);
      result[key] = Array.isArray(value) ? value.map(trim) : trim(value);
    } else if (attr.type === "dynamiczone" && Array.isArray(value)) {
      result[key] = value.map(item => trimContentFields(item, components[item?.__component], components));
    }
  }
  return result;
}

export function registerContentTrimming(strapi: any) {
  strapi.documents.use(async (ctx: any, next: () => Promise<any>) => {
    if (["create", "update"].includes(ctx.action) && ctx.uid.startsWith("api::") && ctx.params?.data) {
      ctx.params.data = trimContentFields(ctx.params.data, strapi.contentTypes[ctx.uid], strapi.components);
    }
    return next();
  });
}
