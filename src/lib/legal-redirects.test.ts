// Redirects in vercel.json that land inside a legal document. A redirect is
// checked against the document's source (src/content/legal/<slug>.mdx), so it
// runs without a build: the section it names must exist, and /refunds, which
// was the refund policy's address before the policy became part of the Terms,
// must land on the Terms section that holds subscription cancellation and
// says which payments are refunded.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Redirect = { source: string; destination: string };

const root = join(import.meta.dirname, '..', '..');
const { redirects } = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf-8')) as { redirects: Redirect[] };
const legal = (slug: string) => join(root, 'src', 'content', 'legal', `${slug}.mdx`);

// Redirects to a section of a page on this site: "/<slug>#<id>".
const intoSections = redirects
  .map((r) => ({ ...r, match: /^\/([a-z0-9-]+)#([a-z0-9-]+)$/.exec(r.destination) }))
  .filter((r) => r.match && existsSync(legal(r.match[1])))
  .map((r) => ({ source: r.source, slug: r.match![1], id: r.match![2] }));

// The level-2 section of a document that carries {#id}: from its heading to
// the next level-2 heading.
function section(slug: string, id: string): string {
  const lines = readFileSync(legal(slug), 'utf-8').split('\n');
  const start = lines.findIndex((line) => line.endsWith(`{#${id}}`));
  if (start < 0) return '';
  const next = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start, next < 0 ? undefined : next).join('\n');
}

describe('redirects into legal documents', () => {
  it('finds at least one, so the checks below are not vacuous', () => {
    expect(intoSections.length).toBeGreaterThan(0);
  });

  it.each(intoSections)('$source lands on a section that /$slug has (#$id)', ({ slug, id }) => {
    expect(section(slug, id), `/${slug} declares {#${id}}`).not.toBe('');
  });

  it('/refunds lands on the Terms section on cancellation and refunds', () => {
    const refunds = intoSections.find((r) => r.source === '/refunds');
    expect(refunds, 'vercel.json redirects /refunds into a legal document').toBeDefined();
    expect(refunds!.slug).toBe('terms');
    const body = section('terms', refunds!.id);
    expect(body.split('\n')[0], `#${refunds!.id} is a numbered section of the Terms`).toMatch(/^## \d+\. /);
    expect(body, `the section at #${refunds!.id} holds subscription cancellation`).toMatch(/\*\*Subscription cancellation\*\*\./);
    expect(body, `the section at #${refunds!.id} says which payments are refunded`).toMatch(/non-refundable/);
  });
});
