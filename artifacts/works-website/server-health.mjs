import fs from "node:fs";
import path from "node:path";

const PUBLIC_PAGES = [
  { locale: "hu", relativePath: "index.html", requestPath: "/" },
  { locale: "en", relativePath: path.join("en", "index.html"), requestPath: "/en" },
];

const HTML_RESOURCE_ATTRIBUTES = new Set([
  "src",
  "href",
  "poster",
  "data",
  "srcset",
]);

const CSS_URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
const JS_IMPORT_PATTERN =
  /(?:\bfrom\s*|\bimport\s*\(|\bimport\s+)["']([^"']+)["']/g;

function pageFilePath(distDir, relativePath) {
  return path.resolve(distDir, relativePath);
}

function isWithinDirectory(directory, filePath) {
  const relative = path.relative(directory, filePath);
  return relative === "" || (relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function isExternalReference(reference) {
  const value = reference.trim().toLowerCase();
  return (
    !value ||
    value.startsWith("#") ||
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("javascript:") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("//") ||
    /^[a-z][a-z\d+\-.]*:/i.test(value)
  );
}

function parseTagAttributes(tag) {
  const attributes = [];
  const attributePattern =
    /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of tag.matchAll(attributePattern)) {
    attributes.push({
      name: match[1].toLowerCase(),
      value: match[2] ?? match[3] ?? match[4] ?? "",
    });
  }

  return attributes;
}

function resolveRequestPath(reference, sourceRequestPath) {
  const rawReference = reference.trim();
  if (isExternalReference(rawReference)) return null;

  let parsed;
  try {
    const base = new URL(
      sourceRequestPath.startsWith("/")
        ? `http://static.invalid${sourceRequestPath}`
        : `http://static.invalid/${sourceRequestPath}`,
    );
    parsed = new URL(rawReference, base);
  } catch {
    return { invalid: true };
  }

  // A malformed backslash or protocol-relative reference must never escape
  // the local origin while being checked.
  if (parsed.origin !== "http://static.invalid") {
    return null;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return { invalid: true };
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return { invalid: true };
  }

  // These are runtime endpoints, not build artifacts.  Checking them would
  // make static readiness depend on the CMS or an API service.
  if (pathname === "/strapi" || pathname.startsWith("/strapi/")) return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;

  return { pathname };
}

function localFileForRequestPath(distDir, pathname) {
  const relativePath = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(distDir, relativePath || "index.html");
  if (!isWithinDirectory(distDir, candidate)) return null;

  try {
    if (fs.statSync(candidate).isFile()) return candidate;
  } catch {
    return null;
  }

  // A relative application route is served by its prerendered index file.
  if (!path.extname(candidate)) {
    const indexCandidate = path.join(candidate, "index.html");
    if (isWithinDirectory(distDir, indexCandidate)) {
      try {
        if (fs.statSync(indexCandidate).isFile()) return indexCandidate;
      } catch {
        // The caller reports the missing reference below.
      }
    }
  }

  return null;
}

function addHtmlReferences(html, requestPath, queue) {
  for (const tagMatch of html.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)) {
    const tagName = tagMatch[1].toLowerCase();
    const attributes = parseTagAttributes(tagMatch[0]);

    for (const attribute of attributes) {
      if (!HTML_RESOURCE_ATTRIBUTES.has(attribute.name)) continue;

      if (attribute.name === "srcset") {
        for (const candidate of attribute.value.split(",")) {
          const reference = candidate.trim().split(/\s+/)[0];
          if (reference) queue.push({ reference, sourceRequestPath: requestPath });
        }
      } else if (
        attribute.name === "src" ||
        attribute.name === "poster" ||
        attribute.name === "data" ||
        (attribute.name === "href" &&
          (tagName === "link" || tagName === "base"))
      ) {
        queue.push({
          reference: attribute.value,
          sourceRequestPath: requestPath,
        });
      }
    }
  }
}

function addAssetReferences(contents, assetPath, queue) {
  const extension = path.extname(assetPath).toLowerCase();

  if (extension === ".css") {
    for (const match of contents.matchAll(CSS_URL_PATTERN)) {
      if (match[2]) {
        queue.push({
          reference: match[2],
          sourceRequestPath: `/${assetPath}`,
        });
      }
    }
    return;
  }

  if (extension !== ".js" && extension !== ".mjs") return;

  for (const match of contents.matchAll(JS_IMPORT_PATTERN)) {
    const reference = match[1];
    if (
      reference.startsWith(".") ||
      reference.startsWith("/assets/") ||
      reference.startsWith("/favicon")
    ) {
      queue.push({
        reference,
        sourceRequestPath: `/${assetPath}`,
      });
    }
  }

}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function hasUsableHtml(html, expectedLocale) {
  const declaredLocale = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1];
  return (
    html.trim().length > 0 &&
    /<html\b/i.test(html) &&
    /<body\b/i.test(html) &&
    (!declaredLocale || declaredLocale.toLowerCase().startsWith(expectedLocale)) &&
    !html.includes("<!--ssr-outlet-->")
  );
}

function canonicalFromHtml(html) {
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => {
      const attributes = parseTagAttributes(tag);
      return attributes.some(
        (attribute) =>
          attribute.name === "rel" &&
          attribute.value
            .split(/\s+/)
            .some((value) => value.toLowerCase() === "canonical"),
      );
    });

  if (!canonicalTag) return null;
  const href = parseTagAttributes(canonicalTag).find(
    (attribute) => attribute.name === "href",
  )?.value;
  if (!href) return null;

  try {
    const url = new URL(href, "http://static.invalid");
    return {
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    };
  } catch {
    return null;
  }
}

function canonicalPath(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function validateCanonicalOrigin(canonicalOrigin) {
  if (canonicalOrigin === null || canonicalOrigin === undefined) return null;
  try {
    // Keep readiness validation aligned with the opt-in redirect setting:
    // HTTPS origins only, with loopback HTTP reserved for local development.
    if (typeof canonicalOrigin !== "string") return null;
    const trimmed = canonicalOrigin.trim();
    const scheme = trimmed.match(/^[a-z][a-z\d+.-]*:\/\//i);
    const authorityAndPath = scheme
      ? trimmed.slice(scheme[0].length)
      : "";
    const authorityEnd = authorityAndPath.search(/[/?#]/);
    const authority =
      authorityEnd === -1
        ? authorityAndPath
        : authorityAndPath.slice(0, authorityEnd);
    const firstSlash = authorityAndPath.indexOf("/");
    const url = new URL(trimmed);
    const isLoopbackHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(
        url.hostname.toLowerCase(),
      );
    if (
      (!(
        url.protocol === "https:" ||
        (url.protocol === "http:" && isLoopbackHttp)
      )) ||
      !url.origin ||
      authority.includes("@") ||
      url.username ||
      url.password ||
      trimmed.includes("\\") ||
      !scheme ||
      (firstSlash !== -1 && authorityAndPath.slice(firstSlash) !== "/") ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Validate only artifacts needed by the static website.  In particular this
 * never performs a CMS, mail provider, or API request.
 */
export function validateStaticBuild({ distDir, canonicalOrigin } = {}) {
  const root = path.resolve(distDir || ".");
  const expectedCanonicalOrigin = validateCanonicalOrigin(canonicalOrigin);
  const issues = [];
  const pages = {};
  const queue = [];
  const visited = new Set();

  if (!fs.existsSync(root)) {
    return {
      ok: false,
      code: "static_build_missing",
      pages,
      issues: [{ code: "static_build_missing" }],
    };
  }

  if (canonicalOrigin !== undefined && canonicalOrigin !== null && !expectedCanonicalOrigin) {
    issues.push({ code: "invalid_canonical_origin" });
  }

  for (const page of PUBLIC_PAGES) {
    const filePath = pageFilePath(root, page.relativePath);
    const html = readText(filePath);
    if (!html) {
      pages[page.locale] = { ok: false, code: "html_missing" };
      issues.push({ code: "html_missing", locale: page.locale });
      continue;
    }

    if (!hasUsableHtml(html, page.locale)) {
      pages[page.locale] = { ok: false, code: "html_unusable" };
      issues.push({ code: "html_unusable", locale: page.locale });
      continue;
    }

    const pageCanonical = canonicalFromHtml(html);
    if (
      expectedCanonicalOrigin &&
      (!pageCanonical ||
        pageCanonical.origin !== expectedCanonicalOrigin ||
        canonicalPath(pageCanonical.pathname) !== canonicalPath(page.requestPath) ||
        pageCanonical.search ||
        pageCanonical.hash)
    ) {
      issues.push({ code: "canonical_origin_mismatch", locale: page.locale });
    }

    pages[page.locale] = { ok: true };
    addHtmlReferences(html, page.requestPath, queue);
  }

  while (queue.length > 0) {
    const item = queue.shift();
    const resolved = resolveRequestPath(item.reference, item.sourceRequestPath);
    if (!resolved) continue;
    if (resolved.invalid) {
      issues.push({ code: "invalid_local_reference" });
      continue;
    }

    const assetPath = localFileForRequestPath(root, resolved.pathname);
    if (!assetPath) {
      issues.push({ code: "asset_missing" });
      continue;
    }

    const relativeAssetPath = path.relative(root, assetPath);
    if (visited.has(relativeAssetPath)) continue;
    visited.add(relativeAssetPath);

    const extension = path.extname(assetPath).toLowerCase();
    if (![".css", ".js", ".mjs"].includes(extension)) continue;

    const contents = readText(assetPath);
    if (contents === null) {
      issues.push({ code: "asset_unreadable" });
      continue;
    }
    addAssetReferences(contents, relativeAssetPath, queue);
  }

  // Keep the public result safe to use in a health response: no filesystem
  // paths or HTML content are returned.
  const uniqueIssues = [];
  const seenIssueCodes = new Set();
  for (const issue of issues) {
    const key = `${issue.code}:${issue.locale || ""}`;
    if (seenIssueCodes.has(key)) continue;
    seenIssueCodes.add(key);
    uniqueIssues.push({ code: issue.code, ...(issue.locale ? { locale: issue.locale } : {}) });
  }

  return {
    ok: uniqueIssues.length === 0,
    code: uniqueIssues.length === 0 ? "static_build_ready" : "static_build_invalid",
    pages,
    issues: uniqueIssues,
  };
}

export const checkStaticReadiness = validateStaticBuild;

export function validateCanonicalSetting(value) {
  return validateCanonicalOrigin(value);
}