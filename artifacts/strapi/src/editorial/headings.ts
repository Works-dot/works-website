import MarkdownIt from "markdown-it";
import { parseDocument, DomUtils } from "htmlparser2";

const md = new MarkdownIt({ html: true });
type Edit = { from: number; to: number; text: string };
function apply(source: string, edits: Edit[]) {
  for (const edit of edits.sort((a, b) => b.from - a.from)) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to);
  return source;
}
function visible(value: string) {
  return DomUtils.textContent(parseDocument(value)).replace(/[\s\u200b\uFEFF]/g, "");
}

/** Patch source ranges rather than reserializing: preserve Markdown and abbr. */
export function normalizeHeadings(source: string): string {
  const lines = source.split("\n");
  const offsets = [0];
  for (const line of lines) offsets.push(offsets.at(-1)! + line.length + 1);
  const tokens = md.parse(source, {});
  const edits: Edit[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading_open" && token.map) {
      const [start, end] = token.map;
      const inline = tokens[i + 1];
      const text = (inline.children ?? []).map(child =>
        child.type === "image" ? child.content : ["text", "code_inline"].includes(child.type) ? child.content : "").join("");
      const hasMedia = (inline.children ?? []).some(child =>
        child.type === "image" || (child.type === "html_inline" && /<(img|svg|video|audio|iframe)\b/i.test(child.content)));
      if (!visible(text) && !hasMedia) {
        edits.push({ from: offsets[start], to: Math.min(source.length, offsets[end]), text: "" });
      } else if (token.tag === "h1") {
        if (token.markup === "=") {
          const line = end - 1;
          edits.push({ from: offsets[line], to: offsets[line] + lines[line].length, text: lines[line].replace(/=+/g, "---") });
        } else {
          const line = lines[start];
          const index = line.indexOf("#");
          edits.push({ from: offsets[start] + index, to: offsets[start] + index + 1, text: "##" });
        }
      }
    }
    if (token.type === "html_block" && token.map) {
      const from = offsets[token.map[0]];
      const to = Math.min(source.length, offsets[token.map[1]]);
      const chunk = source.slice(from, to);
      const document = parseDocument(chunk, { withStartIndices: true, withEndIndices: true });
      const htmlEdits: Edit[] = [];
      function visit(nodes: any[], protectedParent = false) {
        for (const node of nodes) {
          const protectedNode = protectedParent || ["pre", "code", "script", "style"].includes(node.name);
          if (!protectedNode && /^h[1-6]$/.test(node.name ?? "") && node.startIndex != null && node.endIndex != null) {
            const start = node.startIndex;
            const end = node.endIndex + 1;
            if (!visible(DomUtils.textContent(node)) && !DomUtils.findOne(n => n.type === "tag" && ["img", "svg", "video", "audio", "iframe"].includes(n.name), node.children ?? [], true)) {
              htmlEdits.push({ from: start, to: end, text: "" });
            } else if (node.name === "h1") {
              const raw = chunk.slice(start, end);
              htmlEdits.push({ from: start, to: end, text: raw.replace(/^<h1\b/i, "<h2").replace(/<\/h1\s*>$/i, "</h2>") });
            }
          } else if (node.children) visit(node.children, protectedNode);
        }
      }
      visit(document.children);
      if (htmlEdits.length) edits.push({ from, to, text: apply(chunk, htmlEdits) });
    }
  }
  return apply(source, edits);
}
