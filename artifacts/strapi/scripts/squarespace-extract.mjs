// Parses the Squarespace (WordPress-format) export XML and produces
// scripts/squarespace-posts.json — a normalized payload the Strapi bootstrap
// migration (migrateSquarespaceDrafts in src/index.ts) turns into DRAFT blog posts.
//
// Usage:
//   node scripts/squarespace-extract.mjs [--limit 3] [--xml path/to/export.xml]
//
// Re-runnable: it only regenerates the JSON; creating drafts (idempotent by slug)
// happens on the next Strapi restart.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const LIMIT = parseInt(argValue('--limit', '3'), 10);
const XML_PATH = argValue(
  '--xml',
  path.resolve(__dirname, '..', '..', '..', 'attached_assets', 'Squarespace-Wordpress-Export-08-12-2026_1786537551947.xml'),
);
const OUT_PATH = path.resolve(__dirname, 'squarespace-posts.json');

const xml = fs.readFileSync(XML_PATH, 'utf-8');

// ---------- helpers ----------

function decodeEntities(s) {
  return (s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function field(item, tag) {
  const m = item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1] : '';
}

function stripTags(htmlStr) {
  return decodeEntities(htmlStr.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// Convert a fragment of Squarespace rich-text HTML into markdown.
function inlineToMarkdown(htmlStr) {
  let s = htmlStr;
  // links first (keep inner formatting)
  s = s.replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => `[${inlineToMarkdown(inner)}](${href})`);
  s = s.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = inlineToMarkdown(inner).trim();
    return t ? `**${t}**` : '';
  });
  s = s.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = inlineToMarkdown(inner).trim();
    return t ? `*${t}*` : '';
  });
  s = s.replace(/<br\s*\/?>/gi, '  \n');
  s = s.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');
  return decodeEntities(s).replace(/[ \t]+/g, ' ').trim();
}

// Convert one sqs-html-content div's inner HTML into a list of blocks.
// Text runs are accumulated into markdown "text" blocks; indented side-note
// paragraphs (margin-left) become "highlight" blocks.
function richTextToBlocks(inner) {
  const blocks = [];
  let md = [];
  const flush = () => {
    const text = md.join('\n\n').trim();
    if (text) blocks.push({ type: 'text', markdown: text });
    md = [];
  };

  // Tokenize top-level elements: h2/h3/h4, p, ol, ul, blockquote
  const tokenRe = /<(h2|h3|h4|p|ol|ul|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tokenRe.exec(inner)) !== null) {
    const [, tag, attrs, body] = m;
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const t = inlineToMarkdown(body).replace(/\*\*/g, '').trim();
      if (t) md.push(`### ${t}`);
    } else if (tag === 'p') {
      const t = inlineToMarkdown(body);
      if (!t) continue;
      if (/margin-left\s*:\s*[1-9]/.test(attrs)) {
        // Indented side-note → highlight block
        flush();
        blocks.push({ type: 'highlight', markdown: t });
      } else {
        md.push(t);
      }
    } else if (tag === 'ol' || tag === 'ul') {
      const items = [...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => inlineToMarkdown(x[1]));
      const lines = items
        .filter(Boolean)
        .map((t, i) => (tag === 'ol' ? `${i + 1}. ${t}` : `- ${t}`));
      if (lines.length) md.push(lines.join('\n'));
    } else if (tag === 'blockquote') {
      flush();
      const t = inlineToMarkdown(body);
      if (t) blocks.push({ type: 'highlight', markdown: t });
    }
  }
  flush();
  return blocks;
}

// Merge consecutive highlight blocks that belong together (Squarespace splits
// side notes into multiple <p>s → we get several highlight blocks in a row).
function mergeAdjacentHighlights(blocks) {
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === 'highlight' && prev && prev.type === 'highlight') {
      prev.markdown += `\n\n${b.markdown}`;
    } else {
      out.push({ ...b });
    }
  }
  return out;
}

function contentToBlocks(content) {
  const blocks = [];
  // Split the whole content into an ordered stream of:
  //  - sqs-html-content divs
  //  - [caption]<img .../>caption text[/caption] shortcodes
  //  - bare <img .../> tags
  const streamRe = /<div class="sqs-html-content"[^>]*>([\s\S]*?)<\/div>|\[caption[^\]]*\]([\s\S]*?)\[\/caption\]|<img\s([^>]*?)\/?>/gi;
  let m;
  while ((m = streamRe.exec(content)) !== null) {
    if (m[1] !== undefined) {
      blocks.push(...richTextToBlocks(m[1]));
    } else if (m[2] !== undefined) {
      const cap = m[2];
      const img = cap.match(/<img\s[^>]*src="([^"]+)"[^>]*>/i);
      if (img) {
        const caption = stripTags(cap.replace(/<img\s[^>]*>/i, ''));
        blocks.push({ type: 'image', url: decodeEntities(img[1]), caption });
      }
    } else if (m[3] !== undefined) {
      const src = m[3].match(/src="([^"]+)"/);
      const alt = m[3].match(/alt="([^"]*)"/);
      if (src) blocks.push({ type: 'image', url: decodeEntities(src[1]), caption: stripTags(alt ? alt[1] : '') });
    }
  }
  return mergeAdjacentHighlights(blocks);
}

function estimateReadingTime(blocks) {
  const words = blocks
    .filter((b) => b.type !== 'image')
    .map((b) => b.markdown)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} perc`;
}

// ---------- parse ----------

const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

const posts = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  if (!it.includes('<wp:post_type>post</wp:post_type>')) continue;
  if (!it.includes('<wp:status>publish</wp:status>')) continue;

  const link = field(it, 'link');
  const slug = link.split('/').filter(Boolean).pop();
  const rawTitle = decodeEntities(field(it, 'title')).replace(/\s+/g, ' ').trim();

  // Skip Squarespace template placeholder posts ("Blog Post Title One" etc.)
  if (/^Blog Post Title/i.test(rawTitle) || /\s/.test(slug)) continue;
  const date = field(it, 'wp:post_date').slice(0, 10);
  const excerpt = stripTags(field(it, 'excerpt:encoded'));
  const content = field(it, 'content:encoded');

  // Featured image: the attachment item that immediately follows the post item.
  let heroUrl = null;
  const next = items[i + 1];
  if (next && next.includes('<wp:post_type>attachment</wp:post_type>')) {
    heroUrl = decodeEntities(field(next, 'wp:attachment_url')).replace(/^http:/, 'https:');
  }

  const blocks = contentToBlocks(content);
  posts.push({
    slug,
    title: rawTitle,
    date,
    excerpt,
    heroUrl,
    readingTime: estimateReadingTime(blocks),
    blocks,
    sourceUrl: `https://worksdot.hu/blog/${slug}`,
  });
}

posts.sort((a, b) => (a.date < b.date ? 1 : -1));
const selected = posts.slice(0, LIMIT);

fs.writeFileSync(OUT_PATH, JSON.stringify(selected, null, 2));
console.log(`Parsed ${posts.length} published posts; wrote ${selected.length} to ${OUT_PATH}`);
for (const p of selected) {
  const counts = p.blocks.reduce((acc, b) => ((acc[b.type] = (acc[b.type] || 0) + 1), acc), {});
  console.log(`- ${p.date} ${p.slug} | ${p.title.slice(0, 60)} | hero=${p.heroUrl ? 'yes' : 'NO'} | blocks=${JSON.stringify(counts)} | ${p.readingTime}`);
}
