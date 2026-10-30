export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"];

export function jobIso(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) return null;
  const time = Date.parse(value);
  const day = value.slice(0, 10);
  if (!Number.isFinite(time) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return null;
  return new Date(time).toISOString();
}

export function isOpenJob(job, now = Date.now()) {
  return !!job && job.isActive !== false && !!job.publishedAt &&
    (!job.validThrough || (!!jobIso(job.validThrough) && Date.parse(job.validThrough) > now));
}

export function jobFields(job) {
  return Object.fromEntries(["isActive", "originalPublishedAt", "validThrough", "employmentType",
    "streetAddress", "postalCode", "addressLocality", "addressRegion", "addressCountry"].map(key => [key, job[key] ?? null]));
}

export function jobLocationLabel(job) {
  return [job.postalCode, job.addressLocality, job.streetAddress].filter(Boolean).join(", ");
}

export function jobTypeLabel(type, locale = "hu") {
  const labels = {
    FULL_TIME: ["Teljes munkaidő", "Full-time"], PART_TIME: ["Részmunkaidő", "Part-time"],
    CONTRACTOR: ["Vállalkozói", "Contractor"], TEMPORARY: ["Határozott idejű", "Temporary"],
    INTERN: ["Gyakornok", "Intern"], VOLUNTEER: ["Önkéntes", "Volunteer"],
    PER_DIEM: ["Alkalmi", "Per diem"], OTHER: ["Egyéb", "Other"],
  };
  return labels[type]?.[locale === "en" ? 1 : 0] || "";
}

export function missingJobFields(job) {
  return [
    !job.title?.trim() && "title",
    !(job.content?.some(b => b.type !== "image" && b.content?.trim()) || job.excerpt?.trim()) && "description",
    !jobIso(job.originalPublishedAt || job.publishedAt) && "datePosted",
    !jobIso(job.validThrough) && "validThrough",
    jobIso(job.validThrough) && jobIso(job.originalPublishedAt || job.publishedAt) &&
      Date.parse(job.validThrough) <= Date.parse(job.originalPublishedAt || job.publishedAt) && "validThrough must follow datePosted",
    !employmentTypes.includes(job.employmentType) && "employmentType",
    !job.addressLocality?.trim() && "addressLocality",
    !/^[A-Z]{2}$/.test(job.addressCountry || "") && "addressCountry",
  ].filter(Boolean);
}

export function jobSchema(job, { url, locale, organization }, now = Date.now()) {
  if (!isOpenJob(job, now) || missingJobFields(job).length) return null;
  const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const description = [job.excerpt, ...(job.content || []).filter(b => b.type !== "image").map(b => b.content)]
    .filter(Boolean).map(text => `<p>${escape(text)}</p>`).join("\n");
  return {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: job.title, description, url, inLanguage: locale,
    datePosted: jobIso(job.originalPublishedAt || job.publishedAt),
    validThrough: jobIso(job.validThrough), employmentType: job.employmentType,
    hiringOrganization: organization,
    jobLocation: { "@type": "Place", address: {
      "@type": "PostalAddress",
      ...Object.fromEntries(["streetAddress", "postalCode", "addressLocality", "addressRegion", "addressCountry"]
        .filter(key => job[key]?.trim()).map(key => [key, job[key]])),
    } },
  };
}
