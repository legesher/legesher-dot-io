// Every page that renders a "Last updated" line reads LAST_UPDATED[<slug>].
// A missing entry does not fail the build: formatLastUpdated(undefined)
// renders "Invalid Date" on the page and the sitemap silently drops lastmod.
// Parametrized from the real pages directory, never a frozen list.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { LAST_UPDATED, formatLastUpdated } from './page-dates.mjs';

const PAGES_DIR = join(__dirname, '..', 'pages');

const datedPages = readdirSync(PAGES_DIR)
  .filter((name) => name.endsWith('.astro'))
  .filter((name) => readFileSync(join(PAGES_DIR, name), 'utf8').includes('LAST_UPDATED.'))
  .map((name) => name.replace(/\.astro$/, ''));

describe('page-dates', () => {
  it('finds at least the policy pages', () => {
    expect(datedPages).toEqual(expect.arrayContaining(['privacy', 'terms']));
  });

  it.each(datedPages)('%s has a LAST_UPDATED entry matching the key it reads', (slug) => {
    const source = readFileSync(join(PAGES_DIR, `${slug}.astro`), 'utf8');
    const keysRead = [...source.matchAll(/LAST_UPDATED\.([a-zA-Z0-9_]+)/g)].map((m) => m[1]);
    expect(keysRead).toEqual([slug]);
    expect(LAST_UPDATED).toHaveProperty(slug);
  });

  it.each(Object.entries(LAST_UPDATED))('%s is an ISO 8601 date the formatter renders', (_slug, iso) => {
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatLastUpdated(iso)).not.toBe('Invalid Date');
  });

  it.each(Object.keys(LAST_UPDATED))('%s names a page that exists', (slug) => {
    expect(datedPages).toContain(slug);
  });
});
