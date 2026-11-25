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

import { formatLastUpdated, LAST_UPDATED } from './page-dates.mjs';
import { pdfHref } from './legal-pdf.mjs';

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
function text(html: string): string {
  // Text between tags, joined. Not a sanitizer; nothing here is rendered.
  const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
  return html
    .split(/<[^>]*>/)
    .join(' ')
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, ' ')
    .trim();
}
function frontMatter(slug: string): Record<string, unknown> {
  const source = readFileSync(join(root, 'src', 'content', 'legal', `${slug}.mdx`), 'utf-8');
  const block = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
  return Object.fromEntries(
    block.split('\n').map((line) => {
      const i = line.indexOf(':');
      return [line.slice(0, i).trim(), JSON.parse(line.slice(i + 1).trim())];
    }),
  );
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

  it.each(slugs)('%s: the section list numbers each section by its own number', (slug) => {
    // "## 4. Payments" is listed as 04 Payments; an unnumbered section
    // ("Appendix A: ...") is listed with no number.
    const html = page(slug);
    const article = between(html, /<article[\s>]/, '</article>');
    const nav = between(html, /<nav[^>]*aria-label="Sections"/, '</nav>');
    const expected = [...article.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => {
      const heading = text(m[1]);
      const n = /^(\d+)\.\s*(.*)$/.exec(heading);
      return n ? `${n[1].padStart(2, '0')} ${n[2]}` : heading;
    });
    const listed = [...nav.matchAll(/<li[\s>][\s\S]*?<\/li>/g)].map((m) => text(m[0]));
    expect(listed).toEqual(expected);
  });

  it.each(slugs)('%s: every table sits in its own scroll box', (slug) => {
    // A table wider than the text scrolls inside the box (src/components/LegalTable.astro),
    // never the page, and keeps the full width of the text when it fits.
    const article = between(page(slug), /<article[\s>]/, '</article>');
    const tables = article.match(/<table[\s>]/g)?.length ?? 0;
    const boxed = article.match(/<div[^>]*data-legal-table[^>]*>\s*<table[\s>]/g)?.length ?? 0;
    expect(boxed, `${slug}: tables in a scroll box, of ${tables}`).toBe(tables);
  });

  it.each(slugs)('%s: every link to the site names a built page, and its #section is on that page', (slug) => {
    // Covers the links between the legal documents ("/privacy") and within
    // one ("#hosted-paid-plans", "#contact").
    const article = between(page(slug), /<article[\s>]/, '</article>');
    const hrefs = [...article.matchAll(/<a\s[^>]*href="([/#][^"]*)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      const [path, anchor] = href.split('#');
      const target = path === '' ? slug : path.replace(/^\/|\/$/g, '');
      const file = join(output, target, 'index.html');
      expect(existsSync(file), `${slug}: ${href} names a built page`).toBe(true);
      if (anchor) {
        expect(readFileSync(file, 'utf-8'), `${slug}: ${href} has its section`).toContain(`id="${anchor}"`);
      }
    }
  });

  it.each(slugs)('%s: every h2 id on the page is a fixed id from the source', (slug) => {
    // Catches a level-2 heading written in a form the source check does not
    // read (a setext underline, an indented "##", a JSX <h2>), which gets an
    // id made up from its text.
    const article = between(page(slug), /<article[\s>]/, '</article>');
    const declared = new Set(
      [...readFileSync(join(root, 'src', 'content', 'legal', `${slug}.mdx`), 'utf-8').matchAll(/\{#([a-z0-9][a-z0-9-]*)\}/g)].map(
        (m) => m[1],
      ),
    );
    const madeUp = [...article.matchAll(/<h2[^>]*\sid="([^"]+)"/g)].map((m) => m[1]).filter((id) => !declared.has(id));
    expect(madeUp).toEqual([]);
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

  it.each(slugs)('%s: the top of the page holds only the title and the download button', (slug) => {
    const hero = between(page(slug), /<section[^>]*data-legal-hero/, '</section>');
    expect(text(hero)).toBe(`${frontMatter(slug).title} Download PDF`);
    const link = /<a\s[^>]*href="([^"]+)"[^>]*>/.exec(hero);
    expect(link?.[1], `${slug}: the button points at the PDF`).toBe(pdfHref(slug));
    expect(link?.[0], `${slug}: the button downloads`).toMatch(/\sdownload(=|\s|>)/);
    expect(existsSync(join(output, pdfHref(slug))), `${slug}: the PDF is in the build`).toBe(true);
  });

  it.each(slugs)('%s: the details list the date, type, audience and language', (slug) => {
    const fm = frontMatter(slug);
    const details = text(between(page(slug), /<aside[^>]*aria-label="Document details"/, '</aside>'));
    expect(details).toBe(
      [
        'Effective',
        formatLastUpdated(LAST_UPDATED[slug as keyof typeof LAST_UPDATED]),
        'Type',
        fm.type,
        'Audience',
        fm.audience,
        'Language',
        'English',
      ].join(' '),
    );
    // The type tag carries an icon for its type, hidden from screen readers.
    const typeTag = between(page(slug), /<dd[^>]*data-type/, '</dd>');
    expect(typeTag, `${slug}: the type tag has an icon`).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(typeTag, `${slug}: the icon names its type`).toContain(`data-icon="${String(fm.type).toLowerCase()}"`);
    // The audience is one tag, not a list.
    const tag = between(page(slug), /<dd[^>]*data-audience/, '</dd>');
    expect(tag, `${slug}: the audience is one tag`).not.toMatch(/<(ul|li)[\s>]/);
    expect(text(tag), `${slug}: the audience tag`).toBe(fm.audience);
  });
});
