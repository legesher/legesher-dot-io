// The legal pages are Markdown files in src/content/legal. Their left-hand
// section list is built from the level-2 headings, and other pages link to
// those headings by id, so every level-2 heading must carry a fixed id
// ("## Governing Law {#governing-law}"); an id Markdown made up from the
// heading text would move the anchor without anyone noticing.
// Parametrized from the real content directory, never a frozen list.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '..', 'content', 'legal');
const docs = readdirSync(DIR)
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => name.replace(/\.mdx$/, ''));

function source(slug: string): string {
  return readFileSync(join(DIR, `${slug}.mdx`), 'utf8');
}
// Front matter is written one key per line, each value JSON (a quoted
// string, or an array of them).
function frontMatter(slug: string): Record<string, unknown> {
  const block = /^---\n([\s\S]*?)\n---/.exec(source(slug))?.[1] ?? '';
  return Object.fromEntries(
    block.split('\n').map((line) => {
      const i = line.indexOf(':');
      return [line.slice(0, i).trim(), JSON.parse(line.slice(i + 1).trim())];
    }),
  );
}
const AUDIENCES = ['Individual', 'Team', 'Commercial'];
const ID = /\{#([a-z0-9][a-z0-9-]*)\}\s*$/;

describe('legal content', () => {
  it('finds terms, refunds and privacy', () => {
    expect(docs).toEqual(expect.arrayContaining(['terms', 'refunds', 'privacy']));
  });

  it.each(docs)('%s: every level-2 heading carries an explicit id', (slug) => {
    const missing = source(slug)
      .split('\n')
      .filter((line) => line.startsWith('## ') && !ID.test(line));
    expect(missing).toEqual([]);
  });

  it.each(docs)('%s: heading ids are unique', (slug) => {
    const ids = source(slug)
      .split('\n')
      .filter((line) => /^#{2,6} /.test(line))
      .map((line) => ID.exec(line)?.[1])
      .filter(Boolean);
    const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(repeated).toEqual([]);
  });

  it.each(docs)('%s: front matter has title, description, type, audience and entity', (slug) => {
    const fm = frontMatter(slug);
    for (const key of ['title', 'description', 'type', 'entity']) {
      expect(typeof fm[key] === 'string' && fm[key] !== '', `${slug}: ${key}`).toBe(true);
    }
    expect(['Terms', 'Policy']).toContain(fm.type);
    // The audience tags: some of Individual, Team and Commercial, in that order.
    const audience = fm.audience as string[];
    expect(Array.isArray(audience) && audience.length > 0, `${slug}: audience is a non-empty list`).toBe(true);
    expect(audience, `${slug}: audience`).toEqual(AUDIENCES.filter((tag) => audience.includes(tag)));
    expect(fm, `${slug}: appliesTo was replaced by audience`).not.toHaveProperty('appliesTo');
  });
});
