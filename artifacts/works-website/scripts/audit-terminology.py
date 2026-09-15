#!/usr/bin/env python3
"""Audit terminology in the prerendered Works. HTML.

This intentionally reads HTML output rather than source files.  It uses only
the Python standard library so it can also be used in a small CI job before
and after a prerender.  The baseline output is a compact, normalized
representation of the main content; it is not a substitute for a visual or
speech-output test.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable


SKIP_TAGS = {"head", "meta", "link", "script", "style", "noscript", "template"}
BLOCK_TAGS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "br",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "section",
    "table",
    "td",
    "th",
    "tr",
    "ul",
}
HIDDEN_CLASS_NAMES = {
    "invisible",
    "screen-reader-only",
    "sr-only",
    "visually-hidden",
}
RESPONSIVE_VISIBLE_RE = re.compile(
    r"^(?:sm|md|lg|xl|2xl):(?:block|flex|grid|inline|inline-block|inline-flex|table|visible)$"
)
STYLE_HIDDEN_RE = re.compile(
    r"(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|"
    r"content-visibility\s*:\s*hidden)",
    re.IGNORECASE,
)
WHITESPACE_RE = re.compile(r"\s+")
ACRONYM_RE = re.compile(r"(?<![A-Za-z])(?:[A-Z]{2,}(?:/[A-Z]{2,})?|[A-Z]\d[A-Z])(?=[^A-Za-z]|$)")


class Node:
    def __init__(self, tag: str | None = None, attrs: dict[str, str] | None = None):
        self.tag = tag
        self.attrs = attrs or {}
        self.children: list[Node | str] = []
        self.parent: Node | None = None


class DocumentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.document = Node("#document")
        self.stack = [self.document]

    def _attrs(self, attrs: list[tuple[str, str | None]]) -> dict[str, str]:
        return {name.lower(): value or "" for name, value in attrs}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag.lower(), self._attrs(attrs))
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)
        if tag.lower() not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag.lower(), self._attrs(attrs))
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


def normalize(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value).strip()


def is_hidden(node: Node) -> bool:
    attrs = node.attrs
    if "hidden" in attrs or attrs.get("aria-hidden", "").lower() == "true":
        return True
    if STYLE_HIDDEN_RE.search(attrs.get("style", "")):
        return True
    classes = set(attrs.get("class", "").split())
    if classes & HIDDEN_CLASS_NAMES:
        return True
    # Tailwind's responsive "hidden md:flex" is visible at the desktop
    # prerender width, while a lone hidden class is not visible.
    if "hidden" in classes and not any(RESPONSIVE_VISIBLE_RE.match(item) for item in classes):
        return True
    return False


def iter_nodes(node: Node, include_root: bool = False) -> Iterable[Node]:
    if include_root and node.tag is not None:
        yield node
    for child in node.children:
        if isinstance(child, Node):
            yield child
            yield from iter_nodes(child)


def visible_text(node: Node) -> str:
    return normalize(raw_visible_text(node))


def raw_visible_text(node: Node) -> str:
    if node.tag in SKIP_TAGS or is_hidden(node):
        return ""
    pieces: list[str] = []
    for child in node.children:
        if isinstance(child, str):
            pieces.append(child)
        elif child.tag not in SKIP_TAGS and not is_hidden(child):
            text = raw_visible_text(child)
            if text:
                separator = " " if child.tag in BLOCK_TAGS else ""
                pieces.append(separator + text + separator)
    return "".join(pieces)


def find_first(node: Node, tag: str) -> Node | None:
    if node.tag == tag:
        return node
    for child in node.children:
        if isinstance(child, Node):
            found = find_first(child, tag)
            if found:
                return found
    return None


def find_all(node: Node, tag: str) -> list[Node]:
    found: list[Node] = []
    if node.tag == tag:
        found.append(node)
    for child in node.children:
        if isinstance(child, Node):
            found.extend(find_all(child, tag))
    return found


def route_for_file(root: Path, path: Path) -> str:
    relative = path.relative_to(root).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("/index.html")].strip("/")
    return "/" + relative.removesuffix(".html").strip("/")


def page_family(route: str) -> str:
    if route in {"/", "/en"}:
        return "home"
    if route == "/404":
        return "utility"
    language_route = route.removeprefix("/en/")
    if route.startswith("/en/"):
        route = "/en/" + language_route
    if route in {"/adatkezeles", "/en/privacy"}:
        return "legal"
    if route in {"/sutik", "/en/cookies"}:
        return "cookie"
    if route in {"/kapcsolat", "/en/contact"}:
        return "contact"
    if route in {"/rolunk", "/en/about"}:
        return "about"
    if route in {"/karrier", "/en/careers"}:
        return "careers"
    if route in {"/blog", "/en/blog"}:
        return "blog"
    if route.startswith("/blog/") or route.startswith("/en/blog/"):
        return "post"
    if route in {"/projektek", "/en/projects"}:
        return "projects"
    if route.startswith("/projektek/") or route.startswith("/en/projects/"):
        return "case-study"
    if route in {"/szolgaltatasok", "/en/services"}:
        return "services"
    if route.startswith("/szolgaltatasok/") or route.startswith("/en/services/"):
        return "service-detail"
    if route.startswith("/karrier/") or route.startswith("/en/careers/"):
        return "career-detail"
    return "other"


def language_for_route(route: str, html_lang: str) -> str:
    if route == "/en" or route.startswith("/en/"):
        return "en"
    return html_lang or "unknown"


def region_for(node: Node) -> str:
    current = node
    while current is not None:
        if current.tag == "main":
            return "main"
        if current.tag == "header":
            return "header"
        if current.tag == "footer":
            return "footer"
        current = current.parent
    return "other"


def region_nodes(document: Node) -> dict[str, list[Node]]:
    return {
        "main": find_all(document, "main"),
        "header": find_all(document, "header"),
        "footer": find_all(document, "footer"),
    }


def main_text_nodes(main: Node | None) -> str:
    return visible_text(main) if main else ""


def text_context(text: str, start: int, end: int, radius: int = 100) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    context = normalize(text[left:right])
    if left:
        context = "… " + context
    if right < len(text):
        context += " …"
    return context


TERM_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("UX/UI", re.compile(r"(?<![A-Za-z0-9/])UX/UI(?![A-Za-z0-9/])", re.IGNORECASE)),
    ("UX", re.compile(r"(?<![A-Za-z0-9/])UX(?![A-Za-z0-9/])", re.IGNORECASE)),
    ("UI", re.compile(r"(?<![A-Za-z0-9/])UI(?![A-Za-z0-9/])", re.IGNORECASE)),
    ("AI", re.compile(r"(?<![A-Za-z0-9])AI(?![A-Za-z0-9])", re.IGNORECASE)),
    ("service design", re.compile(r"(?<![A-Za-z0-9])service[\s-]+design\w*", re.IGNORECASE)),
    ("design system", re.compile(r"(?<![A-Za-z0-9])design[\s-]+systems?\w*", re.IGNORECASE)),
    ("workshop", re.compile(r"(?<![A-Za-z0-9])workshops?\w*", re.IGNORECASE)),
    ("wireframe", re.compile(r"(?<![A-Za-z0-9])wireframes?\w*", re.IGNORECASE)),
    ("dashboard", re.compile(r"(?<![A-Za-z0-9])dashboards?\w*", re.IGNORECASE)),
]


def accessible_attributes(node: Node) -> list[tuple[str, str]]:
    if node.tag in SKIP_TAGS or is_hidden(node):
        return []
    values: list[tuple[str, str]] = []
    if node.tag == "img" and node.attrs.get("alt", ""):
        values.append(("alt", node.attrs["alt"]))
    if node.attrs.get("aria-label", ""):
        values.append(("aria-label", node.attrs["aria-label"]))
    return values


def collect_accessible(node: Node) -> list[dict[str, str]]:
    found: list[dict[str, str]] = []
    if node.tag in SKIP_TAGS or is_hidden(node):
        return found
    for attr, value in accessible_attributes(node):
        found.append({"region": region_for(node), "attribute": attr, "value": normalize(value)})
    for child in node.children:
        if isinstance(child, Node):
            found.extend(collect_accessible(child))
    return found


def collect_main_hrefs(main: Node | None) -> list[dict[str, str]]:
    if main is None:
        return []
    links: list[dict[str, str]] = []
    for node in find_all(main, "a"):
        if is_hidden(node):
            continue
        href = node.attrs.get("href")
        if href is not None:
            links.append(
                {
                    "href": href,
                    "text": visible_text(node),
                    "lang": node.attrs.get("lang", ""),
                }
            )
    return links


def collect_main_values(main: Node | None) -> list[dict[str, str]]:
    if main is None:
        return []
    values: list[dict[str, str]] = []
    for node in find_all(main, "input") + find_all(main, "textarea") + find_all(main, "select"):
        if is_hidden(node):
            continue
        values.append(
            {
                "tag": node.tag or "",
                "name": node.attrs.get("name", ""),
                "type": node.attrs.get("type", ""),
                "value": node.attrs.get("value", ""),
                "text": visible_text(node),
            }
        )
    return values


def baseline_page(root: Path, path: Path) -> dict:
    parser = DocumentParser()
    parser.feed(path.read_text(encoding="utf-8"))
    document = parser.document
    html = find_first(document, "html")
    main = find_first(document, "main")
    html_lang = html.attrs.get("lang", "") if html else ""
    route = route_for_file(root, path)
    regions = region_nodes(document)
    return {
        "route": route,
        "file": path.relative_to(root).as_posix(),
        "language": language_for_route(route, html_lang),
        "html_lang": html_lang,
        "page_family": page_family(route),
        "main_visible_text": main_text_nodes(main),
        "main_headings": [
            visible_text(heading)
            for heading in find_all(main, "h1") + find_all(main, "h2") + find_all(main, "h3") + find_all(main, "h4") + find_all(main, "h5") + find_all(main, "h6")
            if not is_hidden(heading) and visible_text(heading)
        ]
        if main
        else [],
        "main_hrefs": collect_main_hrefs(main),
        "main_values": collect_main_values(main),
        "shared_visible_text": {
            region: " ".join(
                visible_text(item) for item in nodes if visible_text(item)
            )
            for region, nodes in regions.items()
        },
        "accessible_attributes": collect_accessible(document),
    }


def audit_terms(pages: list[dict]) -> dict:
    term_data: dict[str, dict] = {}
    acronym_data: dict[str, dict] = {}
    region_counts: dict[str, Counter] = defaultdict(Counter)
    language_counts: dict[str, Counter] = defaultdict(Counter)
    route_texts: list[tuple[dict, str, str, str]] = []

    for page in pages:
        route = page["route"]
        language = page["language"]
        regions = {
            "main": page["main_visible_text"],
            "header_footer": " ".join(
                page["shared_visible_text"].get(region, "")
                for region in ("header", "footer")
            ),
            "accessible_attributes": " ".join(
                item["value"] for item in page["accessible_attributes"]
            ),
        }
        for region, text in regions.items():
            if not text:
                continue
            route_texts.append((page, region, text, language))
            for label, pattern in TERM_PATTERNS:
                matches = list(pattern.finditer(text))
                if not matches:
                    continue
                data = term_data.setdefault(
                    label,
                    {"occurrences": 0, "routes": set(), "languages": Counter(), "regions": Counter(), "examples": []},
                )
                data["occurrences"] += len(matches)
                data["routes"].add(route)
                data["languages"][language] += len(matches)
                data["regions"][region] += len(matches)
                for match in matches[:2]:
                    if len(data["examples"]) < 8:
                        data["examples"].append(
                            {
                                "route": route,
                                "region": region,
                                "language": language,
                                "match": match.group(0),
                                "context": text_context(text, match.start(), match.end()),
                            }
                        )
                region_counts[region][label] += len(matches)
                language_counts[language][label] += len(matches)

            for match in ACRONYM_RE.finditer(text):
                value = match.group(0)
                data = acronym_data.setdefault(
                    value,
                    {"occurrences": 0, "routes": set(), "languages": Counter(), "regions": Counter(), "examples": []},
                )
                data["occurrences"] += 1
                data["routes"].add(route)
                data["languages"][language] += 1
                data["regions"][region] += 1
                if len(data["examples"]) < 4:
                    data["examples"].append(
                        {
                            "route": route,
                            "region": region,
                            "language": language,
                            "context": text_context(text, match.start(), match.end()),
                        }
                    )

    def serialise(data: dict[str, dict]) -> dict[str, dict]:
        output: dict[str, dict] = {}
        for label, values in sorted(data.items(), key=lambda item: (-item[1]["occurrences"], item[0])):
            output[label] = {
                "occurrences": values["occurrences"],
                "routes": len(values["routes"]),
                "languages": dict(sorted(values["languages"].items())),
                "regions": dict(sorted(values["regions"].items())),
                "examples": values["examples"],
            }
        return output

    return {
        "terms": serialise(term_data),
        "acronyms": serialise(acronym_data),
        "term_region_counts": {
            region: dict(sorted(counts.items()))
            for region, counts in sorted(region_counts.items())
        },
        "term_language_counts": {
            language: dict(sorted(counts.items()))
            for language, counts in sorted(language_counts.items())
        },
    }


def serialise_baseline(pages: list[dict]) -> dict:
    return {
        "schema_version": 1,
        "source": "dist/public prerendered HTML",
        "page_count": len(pages),
        "pages": sorted(pages, key=lambda page: page["route"]),
    }


def json_default(value):
    if isinstance(value, set):
        return sorted(value)
    if isinstance(value, Counter):
        return dict(value)
    raise TypeError(f"Cannot serialise {type(value).__name__}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent / "dist/public")
    parser.add_argument("--baseline", type=Path, help="Write the normalized route baseline JSON here.")
    parser.add_argument("--report", type=Path, help="Write the terminology audit JSON here.")
    args = parser.parse_args()

    paths = sorted(args.root.rglob("*.html"))
    if not paths:
        parser.error(f"No prerendered HTML found under {args.root}; build the website first.")
    pages = [baseline_page(args.root, path) for path in paths]
    baseline = serialise_baseline(pages)
    report = {
        "schema_version": 1,
        "source": "dist/public prerendered HTML",
        "page_count": len(pages),
        "languages": dict(sorted(Counter(page["language"] for page in pages).items())),
        "families": dict(sorted(Counter(page["page_family"] for page in pages).items())),
        "terms": audit_terms(pages),
    }
    if args.baseline:
        args.baseline.parent.mkdir(parents=True, exist_ok=True)
        args.baseline.write_text(json.dumps(baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=json_default) + "\n", encoding="utf-8")
    if not args.baseline and not args.report:
        print(json.dumps(report, ensure_ascii=False, indent=2, default=json_default))
    else:
        print(json.dumps({key: value for key, value in report.items() if key != "terms"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()