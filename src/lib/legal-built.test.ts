// Built-page checks for the legal pages (src/content/legal, rendered by
// src/layouts/LegalLayout.astro). The section list on the left must link
// every level-2 heading of the document, in order, and the review markers
// (data-review spans, which render nothing) must sit inside a paragraph,
// list item or table cell: in MDX a line that starts with a tag becomes a
// block of its own, which would break the paragraph around it.
// Parametrized from the real content directory. CI builds before it tests;
// locally the suite skips, by name, until `npm run build` has run.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..');
const output = join(root, '.vercel', 'output', 'static');
const slugs = readdirSync(join(root, 'src', 'content', 'legal'))
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));
const built = existsSync(output);
const suite = built || process.env.CI ? describe : describe.skip;

const VOID = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'wbr']);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;

function page(slug: string): string {
  return readFileSync(join(output, slug, 'index.html'), 'utf-8');
}
function between(html: string, open: RegExp, close: string): string {
  const start = html.search(open);
  if (start < 0) return '';
  return html.slice(start, html.indexOf(close, start) + close.length);
}

suite('legal pages: section list and review markers (needs npm run build)', () => {
  it.each(slugs)('%s: the section list links every h2 id in order', (slug) => {
    const html = page(slug);
    const article = between(html, /<article[\s>]/, '</article>');
    const nav = between(html, /<nav[^>]*aria-label="Sections"/, '</nav>');
    const headingIds = [...article.matchAll(/<h2[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    const links = [...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    expect(headingIds.length, `${slug}: the article has h2 headings`).toBeGreaterThan(0);
    expect(links).toEqual(headingIds);
  });

  it.each(slugs)('%s: every review marker sits inside a p, li, td or th', (slug) => {
    const article = between(page(slug), /<article[\s>]/, '</article>');
    const stack: string[] = [];
    const stray: string[] = [];
    for (const [, closing, name, rest] of article.matchAll(TAG)) {
      const tag = name.toLowerCase();
      if (closing) {
        const i = stack.lastIndexOf(tag);
        if (i >= 0) stack.length = i;
        continue;
      }
      if (tag === 'span' && /data-review=/.test(rest)) {
        if (!stack.some((open) => ['p', 'li', 'td', 'th'].includes(open))) {
          stray.push(rest.trim());
        }
      }
      if (!VOID.has(tag) && !rest.trim().endsWith('/')) stack.push(tag);
    }
    expect(stray).toEqual([]);
  });
});
