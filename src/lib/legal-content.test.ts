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
// A document is for all users, or is its own document for one audience.
const AUDIENCES = ['All users', 'Individual', 'Business'];
const ID = /\{#([a-z0-9][a-z0-9-]*)\}\s*$/;

describe('legal content', () => {
  it('finds terms and privacy', () => {
    expect(docs).toEqual(expect.arrayContaining(['terms', 'privacy']));
  });

  // Every legal document carries the same sentence about Legesher, word for
  // word: the one that opens the Terms' Section 1, Who We Are.
  it('every document carries the same sentence about Legesher', () => {
    const lines = source('terms').split('\n');
    const start = lines.indexOf('## 1. Who We Are {#who-we-are}');
    expect(start, 'the Terms have "## 1. Who We Are {#who-we-are}"').toBeGreaterThanOrEqual(0);
    const sentence = lines.slice(start + 1).find((line) => line.trim() !== '') ?? '';
    expect(sentence).toMatch(/^Legesher is /);
    const missing = docs.filter((slug) => !source(slug).split('\n').includes(sentence));
    expect(missing, `documents without the sentence: ${sentence}`).toEqual([]);
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

  it.each(docs)('%s: front matter has title, description, type and audience', (slug) => {
    const fm = frontMatter(slug);
    for (const key of ['title', 'description', 'type']) {
      expect(typeof fm[key] === 'string' && fm[key] !== '', `${slug}: ${key}`).toBe(true);
    }
    expect(['Terms', 'Policy']).toContain(fm.type);
    // One audience per document: All users, or a document of its own for one audience.
    expect(AUDIENCES, `${slug}: audience`).toContain(fm.audience);
    expect(fm, `${slug}: appliesTo was replaced by audience`).not.toHaveProperty('appliesTo');
    // The pages name no issuing company: the Terms name the contracting company in their opening.
    expect(fm, `${slug}: no entity`).not.toHaveProperty('entity');
  });

  it.each(docs)('%s: opens with its introduction, with no heading above it', (slug) => {
    // The reader sees the opening paragraphs first; the numbered sections follow.
    const body = source(slug).replace(/^---\n[\s\S]*?\n---\n/, '');
    const opening = body.slice(0, body.search(/^## /m)).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim();
    expect(opening.length, `${slug}: text before the first section`).toBeGreaterThan(0);
    expect(body.split('\n').filter((line) => /^#{2,3} (\d+\.\s*)?Introduction\b/.test(line))).toEqual([]);
  });

  it.each(docs)('%s: numbered sections run 1, 2, 3 and their clauses N.1, N.2', (slug) => {
    // A section is a numbered level-2 heading ("## 4. Payments"); an unnumbered
    // one ("## Appendix A: ...") stands outside the count. A
    // clause is a numbered level-3 heading or a paragraph that opens with its
    // number ("4.2 Prices exclude tax."); clauses run from 1 in each section.
    const lines = source(slug).split('\n');
    if (!lines.some((line) => /^## \d+\. /.test(line))) return; // an unnumbered document
    let section = 0;
    let numbered = false;
    let clause = 0;
    const wrong: string[] = [];
    for (const line of lines) {
      if (line.startsWith('## ')) {
        numbered = /^## \d+\. /.test(line);
        clause = 0;
        if (numbered) {
          section += 1;
          if (!line.startsWith(`## ${section}. `)) wrong.push(`${line} (expected ${section}.)`);
        }
        continue;
      }
      const number = /^(?:### )?(\d+)\.(\d+) /.exec(line);
      if (!number) continue;
      clause += 1;
      if (!numbered || line.replace(/^### /, '').split(' ')[0] !== `${section}.${clause}`) {
        wrong.push(`${line.slice(0, 50)} (expected ${numbered ? `${section}.${clause}` : 'no clause number'})`);
      }
    }
    expect(wrong).toEqual([]);
  });

  // The section and clause numbers a document has: numbered headings ("## 4. ",
  // "### 4.2 ") and paragraphs that open with a clause number ("4.2 "). A
  // paragraph that opens with a bare number ("18 languages ...") is not one.
  function numbersIn(slug: string): Set<string> {
    return new Set(
      source(slug)
        .split('\n')
        .map((line) => (/^#{2,3} (\d+(?:\.\d+)?)\.? /.exec(line) ?? /^(\d+\.\d+) /.exec(line))?.[1])
        .filter((n): n is string => Boolean(n)),
    );
  }

  it.each(docs)('%s: every "Section N" reference names a section the document has', (slug) => {
    const text = source(slug);
    // "Section 7", "sections 4.2, 7.4, and 15", a bare "in 3.1", "under 3.1" or
    // "as 5.3 provides", and "Terms, Section 2.1" (checked against the Terms).
    const LIST = /, and |, | and /;
    const refs = [
      ...[...text.matchAll(/\b(Terms, )?sections? (\d+(?:\.\d+)?(?:(?:, and |, | and )\d+(?:\.\d+)?)*)/gi)].flatMap((m) =>
        m[2].split(LIST).map((ref) => ({ doc: m[1] ? 'terms' : slug, ref })),
      ),
      ...[...text.matchAll(/\b(?:in|under|as) (\d+\.\d+)\b/g)].map((m) => ({ doc: slug, ref: m[1] })),
      // A range in a "Sections ..." sentence ("Sections 4 (...) and 9-13"): every number in it.
      ...[...text.matchAll(/\bsections? [^.]*?\b(\d+)[-–](\d+)\b/gi)].flatMap((m) =>
        Array.from({ length: Math.max(Number(m[2]) - Number(m[1]) + 1, 1) }, (_, i) => ({
          doc: slug,
          ref: String(Number(m[1]) + i),
        })),
      ),
    ];
    expect(refs.filter(({ doc, ref }) => !numbersIn(doc).has(ref)).map(({ doc, ref }) => `${doc} ${ref}`)).toEqual([]);
  });
});

