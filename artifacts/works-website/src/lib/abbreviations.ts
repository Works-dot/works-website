/** Only abbr/title is interpreted as HTML. All other raw HTML stays escaped. */
interface Node {
  type: string;
  value?: string;
  children?: Node[];
  data?: Record<string, unknown>;
}

export function decodeAbbreviationTitle(value: string): string {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: "\u00a0" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (original, entity: string) => {
    if (!entity.startsWith("#")) return named[entity] ?? original;
    const n = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "\ufffd";
  });
}

export function abbreviationRemarkPlugin() {
  return (tree: Node) => {
    function visit(node: Node) {
      if (!node.children || ["code", "inlineCode", "abbreviation"].includes(node.type)) return;
      const children = node.children;
      for (let i = 0; i < children.length; i++) {
        const start = children[i];
        const match = start.type === "html" && start.value?.match(/^<abbr\s+title\s*=\s*(?:"([^"]*)"|'([^']*)')\s*>$/i);
        if (match) {
          const end = children.findIndex((child, index) => index > i && child.type === "html");
          if (end > i && /^<\/abbr\s*>$/i.test(children[end].value ?? "")) {
            const title = decodeAbbreviationTitle(match[1] ?? match[2]);
            if (title.trim()) {
              children.splice(i, end - i + 1, {
                type: "abbreviation",
                data: { hName: "abbr", hProperties: { title } },
                children: children.slice(i + 1, end),
              });
            }
          }
        }
        visit(children[i]);
      }
    }
    visit(tree);
  };
}
