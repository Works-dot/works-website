export function linkedinProfile(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && /^(www\.)?linkedin\.com$/.test(u.hostname) &&
      !u.username && !u.password && /^\/in\/[^/]+\/?$/.test(u.pathname)
      ? u.href : "";
  } catch { return ""; }
}

// Old deployed CMS schemas reject unknown populate fields. Retry only that
// precise compatibility case, never turn arbitrary API errors into empty data.
export async function fetchAuthorResponse(fetcher, url) {
  const response = await fetcher(url);
  if (response.status !== 400 || !String(url).includes("manualAuthor")) return response;
  const error = await response.clone().json().catch(() => null);
  if (!/invalid key manualAuthor/i.test(error?.error?.message || "")) return response;
  const legacy = new URL(url);
  for (const [key, value] of [...legacy.searchParams]) {
    if (key.startsWith("populate") && value === "manualAuthor.image") legacy.searchParams.delete(key);
  }
  return fetcher(legacy.toString());
}

export function resolveArticleAuthor(raw, imageUrl = value => value || "") {
  const manual = raw.authorMode === "manual";
  const person = manual ? raw.manualAuthor : raw.author;
  if (!person?.name?.trim()) return null;
  return {
    name: person.name.trim(),
    jobTitle: (person.title || "").trim(),
    bio: (person.bio || "").trim(),
    image: person.image?.url ? imageUrl(person.image.url) : "",
    imageAlt: person.image?.alternativeText || "",
    linkedinUrl: linkedinProfile(person.linkedinUrl),
    worksFor: !manual,
  };
}

export function articleAuthor(post) {
  // Explicit null from a current response must not revive a deleted author.
  if (Object.hasOwn(post, "authorDetails")) return post.authorDetails;
  return post.author?.trim() ? { name: post.author.trim(), worksFor: false } : null;
}

export function personSchema(author, absoluteUrl, organizationId) {
  if (!author?.name) return undefined;
  const person = { "@type": "Person", name: author.name };
  if (author.jobTitle) person.jobTitle = author.jobTitle;
  if (author.image) person.image = absoluteUrl(author.image);
  const linkedin = linkedinProfile(author.linkedinUrl);
  if (linkedin) person.sameAs = [linkedin];
  if (author.worksFor) person.worksFor = { "@id": organizationId };
  return person;
}
