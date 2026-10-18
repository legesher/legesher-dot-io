import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Companion to layout-head.test.ts, which reads the layout's source. This one
// reads what the build produced, page by page, so a page that brings its own
// <head>, or a component that renders a custom element into it, cannot push
// the Content Security Policy meta into <body> unnoticed (CORE-2450). CI
// builds before it tests, so the output exists there; locally the suite
// skips, by name, until `npm run build` has run.

const root = join(import.meta.dirname, '..', '..');
const output = join(root, '.vercel', 'output', 'static');

const HEAD_ELEMENTS = new Set([
  'meta',
  'link',
  'title',
  'script',
  'style',
  'base',
  'noscript',
  'template',
]);

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const pages = existsSync(output) ? htmlFiles(output).map((path) => relative(output, path)) : [];
const suite = pages.length > 0 || process.env.CI ? describe : describe.skip;

suite('every built page keeps the Content Security Policy inside <head> (needs npm run build)', () => {
  it('has build output to check', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)('%s', (page) => {
    const html = readFileSync(join(output, page), 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
    const headOpen = html.search(/<head[\s>]/i);
    const headClose = html.search(/<\/head>/i);
    const meta = html.search(/<meta[^>]+http-equiv=["']content-security-policy["']/i);

    expect(headOpen, 'has a <head>').toBeGreaterThan(-1);
    expect(headClose, 'closes <head>').toBeGreaterThan(headOpen);
    expect(meta, 'carries a Content Security Policy meta').toBeGreaterThan(-1);
    expect(meta, 'the CSP meta sits before </head>').toBeLessThan(headClose);

    // Raw-text elements keep their contents as text, so a JSON-LD script or a
    // <noscript> pixel is not a tag the parser would act on; blank them out.
    // Everything else that is not a tag is text, and text in <head> closes it
    // exactly like a foreign element: an escaped component rendered through a
    // slot arrives as text and would otherwise pass unnoticed.
    const before = html
      .slice(headOpen, meta)
      .replace(/<(script|style|title|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '<$1></$1>');
    const foreign = Array.from(before.matchAll(/<([A-Za-z][\w-]*)/g), (m) => m[1].toLowerCase()).filter(
      (name) => name !== 'head' && !HEAD_ELEMENTS.has(name),
    );
    expect(foreign, 'no element the parser would move to <body> precedes the CSP meta').toEqual([]);
    expect(
      before.replace(/<[^>]*>/g, '').trim(),
      'no text precedes the CSP meta in <head>',
    ).toBe('');
  });
});
