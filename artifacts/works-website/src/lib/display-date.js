// CMS editorial dates are calendar days, not instants in the viewer's timezone.
const formatters = {
  hu: new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
};

export function displayDate(value, locale) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;
  return { dateTime: value, text: formatters[locale === "en" ? "en" : "hu"].format(parsed) };
}
