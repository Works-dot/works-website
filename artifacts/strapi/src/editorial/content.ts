import { errors } from "@strapi/utils";
import { normalizeHeadings } from "./headings";

export const DESCRIPTION_LIMIT = 160;
// Same UTF-16 length semantics as Strapi's maxLength and HTML maxlength.
export const descriptionLength = (text: string) => text.length;

export function normalizeEditorialContent(data: any, schema: any, components: Record<string, any>, path: (string | number)[] = []): any {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const result = { ...data };
  for (const [key, attr] of Object.entries<any>(schema?.attributes ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    const fieldPath = [...path, key];
    if (key === "metaDescription" && typeof value === "string" && descriptionLength(value.trim()) > DESCRIPTION_LIMIT) {
      throw new errors.ValidationError("A meta description legfeljebb 160 karakter lehet.", {
        errors: [{ path: fieldPath, message: "A meta description legfeljebb 160 karakter lehet.", name: "ValidationError" }],
      });
    }
    if (attr.type === "richtext" && typeof value === "string") {
      result[key] = normalizeHeadings(value);
    } else if (attr.type === "component") {
      result[key] = Array.isArray(value)
        ? value.map((item, index) => normalizeEditorialContent(item, components[attr.component], components, [...fieldPath, index]))
        : normalizeEditorialContent(value, components[attr.component], components, fieldPath);
    } else if (attr.type === "dynamiczone" && Array.isArray(value)) {
      result[key] = value.map((item, index) => normalizeEditorialContent(item, components[item?.__component], components, [...fieldPath, index]));
    }
  }
  return result;
}
