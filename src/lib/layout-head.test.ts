import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Astro appends the Content Security Policy as the last <meta> in <head>.
// The HTML parser closes <head> at the first element that is not allowed
// there, and an Astro component that renders a custom element (the Vercel
// analytics tags) is exactly that. Everything after it, the CSP meta
// included, lands in <body>, and browsers ignore a CSP delivered outside
// <head> (CORE-2450). So the layout's <head> may hold only the elements the
// parser keeps there, and the analytics components render after the page
// content instead.

const layout = readFileSync(
  join(import.meta.dirname, '..', 'layouts', 'Layout.astro'),
  'utf-8',
);

const HEAD_ELEMENTS = new Set(['meta', 'link', 'title', 'script', 'style', 'base', 'noscript']);

function section(source: string, open: string, close: string): string {
  const start = source.indexOf(open);
  const end = source.indexOf(close, start);
  if (start < 0 || end < 0) throw new Error(`${open} ... ${close} not found in Layout.astro`);
  return source.slice(start + open.length, end);
}

const head = section(layout, '<head>', '</head>');
const body = section(layout, '<body', '</body>');

describe('Layout.astro keeps the Content Security Policy inside <head>', () => {
  it('opens no element in <head> that the HTML parser would move to <body>', () => {
    const opened = Array.from(head.matchAll(/<([A-Za-z][\w-]*)/g), (m) => m[1]);
    const foreign = opened.filter((name) => !HEAD_ELEMENTS.has(name));
    expect(foreign).toEqual([]);
  });

  it('renders the Vercel analytics components after the page content in <body>', () => {
    const slot = body.indexOf('<slot');
    expect(slot).toBeGreaterThan(-1);
    for (const component of ['<SpeedInsights', '<Analytics']) {
      const at = body.indexOf(component);
      expect(at, `${component} is in <body>`).toBeGreaterThan(-1);
      expect(at, `${component} comes after the slot`).toBeGreaterThan(slot);
    }
  });
});
