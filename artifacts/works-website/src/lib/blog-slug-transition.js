// Phase 1: new HU URLs are aliases only. Keep existing CMS slugs and canonical
// URLs until this release has been deployed and verified on Railway.
export const HU_BLOG_SLUG_PAIRS = {
  "why-lofi-design-is-important-in-the-design-process": "miert-fontos-a-lofi-design",
  "microinteractions-when-how-and-why": "mikrointerakciok-mikor-hogyan-miert",
  "how-state-diagram-can-help-designers": "allapotdiagram-a-tervezesben",
  "is-the-ux-designer-a-dying-breed-mlfg5": "kihalofelben-a-ux-designer",
  "how-do-we-pay-online": "hogyan-fizetunk-online",
  "the-economic-effects-of-covid-19": "a-covid-hatasa-az-online-vasarlasra",
  "shipping-and-receiving": "szallitas-es-atvetel",
  "messages-during-shipping": "ertesitesek-a-szallitas-alatt",
  "issues-with-packages": "problemak-a-csomaggal",
};
const originalByAlias = Object.fromEntries(
  Object.entries(HU_BLOG_SLUG_PAIRS).map(([oldSlug, newSlug]) => [newSlug, oldSlug]),
);
export function sourceHuBlogSlug(slug) {
  return Object.hasOwn(originalByAlias, slug) ? originalByAlias[slug] : slug;
}
export function canonicalTransitionPath(path) {
  return path.replace(/^\/blog\/([^/?#]+)/, (_, slug) => `/blog/${sourceHuBlogSlug(slug)}`);
}
