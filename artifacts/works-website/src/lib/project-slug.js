export const OLD_PROJECT_SLUG = "informacios-architektura-B2B-webshophoz";
export const PROJECT_SLUG = "informacios-architektura-b2b-webshophoz";
export function normalizeProjectSlug(slug) {
  return slug === OLD_PROJECT_SLUG ? PROJECT_SLUG : slug;
}
