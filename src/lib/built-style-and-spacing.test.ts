import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';
import { LAST_UPDATED, formatLastUpdated } from './page-dates.mjs';

// Two Astro 7 defaults that the rest of the suite does not see, checked on
// what the build produced (CORE-1527):
//
// - Since Astro 7.2.5 a CSP directive that lists 'unsafe-inline' gets no
//   hashes, so style-src would quietly let any inline style through. The
//   policy must stay hash-only, with every inline <style> hashed.
// - Since Astro 7.0 compressHTML defaults to 'jsx' rules, which drop the
//   space between text and an inline element ("·Last updated", in the legal
//   pages' old byline). No page shows that shape today, so a built-page check
//   could not fail; the setting itself is checked instead.
//
// CI builds before it tests; locally the suites skip, by name, until
// `npm run build` has run.

const root = join(import.meta.dirname, '..', '..');
const output = join(root, '.vercel', 'output', 'static');

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const pages = existsSync(output) ? htmlFiles(output).map((path) => relative(output, path)) : [];
const suite = pages.length > 0 || process.env.CI ? describe : describe.skip;

suite('style-src stays hash-only on every built page (needs npm run build)', () => {
  it('has build output to check', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)('%s', (page) => {
    const html = readFileSync(join(output, page), 'utf-8');
    const csp =
      html.match(/<meta[^>]+http-equiv=["']content-security-policy["'][^>]*content="([^"]+)"/i)?.[1] ?? '';
    const styleSrc =
      csp
        .split(';')
        .map((directive) => directive.trim().split(/\s+/))
        .find((directive) => directive[0] === 'style-src') ?? [];

    expect(styleSrc, 'the policy has a style-src directive').not.toEqual([]);
    expect(styleSrc, "style-src carries no 'unsafe-inline'").not.toContain("'unsafe-inline'");
    expect(
      styleSrc.some((source) => source.startsWith("'sha256-")),
      'style-src carries hashes',
    ).toBe(true);
    for (const [, body] of html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)) {
      const hash = `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
      expect(styleSrc, 'every inline <style> is hashed in style-src').toContain(hash);
    }
  });
});

describe('astro.config.mjs', () => {
  it('keeps compressHTML true (Astro 7 defaults to jsx rules that drop spaces)', () => {
    expect(config.compressHTML).toBe(true);
  });
});

// The date shows once, as Effective in the document details
// (legal-built.test.ts checks the row); no closing "Effective date" line repeats it.
suite('each dated page shows its effective date once (needs npm run build)', () => {
  it.each(Object.entries(LAST_UPDATED))('%s', (slug, iso) => {
    const html = readFileSync(join(output, slug, 'index.html'), 'utf-8');
    // Text between tags, joined. Not a sanitizer; nothing here is rendered.
    const text = html
      .split(/<[^>]*>/)
      .join('')
      .replace(/\s+/g, ' ');
    expect(text.split(formatLastUpdated(iso)).length - 1, `${slug}: times the date appears`).toBe(1);
  });
});
