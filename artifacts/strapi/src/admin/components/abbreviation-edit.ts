export interface AbbreviationSelection {
  from: number;
  to: number;
  text: string;
  title: string;
  existing: boolean;
}

export function escapeAbbreviation(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function decode(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, key) =>
    ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" })[key]!);
}

/** Selecting the word or putting the caret inside an existing abbr edits it. */
export function abbreviationSelection(source: string, from: number, to: number): AbbreviationSelection {
  for (const match of source.matchAll(/<abbr\s+title=(?:"([^"]*)"|'([^']*)')\s*>([^<>]*)<\/abbr\s*>/gi)) {
    const start = match.index!;
    const end = start + match[0].length;
    if (from >= start && to <= end) {
      return { from: start, to: end, text: decode(match[3]), title: decode(match[1] ?? match[2]), existing: true };
    }
  }
  return { from, to, text: source.slice(from, to), title: "", existing: false };
}

export function abbreviationReplacement(selection: AbbreviationSelection, title: string, remove = false): string {
  if (remove) return selection.text;
  if (!selection.text.trim() || !title.trim()) throw new Error("A rövidítés és a feloldás megadása kötelező.");
  if (!selection.existing && /[<>\n\r]/.test(selection.text)) throw new Error("Csak a rövidítés szövegét jelöld ki, HTML-elemek nélkül.");
  return `<abbr title="${escapeAbbreviation(title.trim())}">${escapeAbbreviation(selection.text)}</abbr>`;
}
