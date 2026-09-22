import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LINKS } from './links';

type Redirect = { source: string; destination: string; permanent?: boolean };

// vercel.json is static JSON and cannot import LINKS, so its /go/* copies are
// a second source of truth (see the note at the top of links.ts). This keeps
// the two from drifting: every /go/<name> whose name is a LINKS key has to
// point at exactly the LINKS value.
const { redirects } = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
) as { redirects: Redirect[] };

const goRedirects = redirects
  .filter((redirect) => redirect.source.startsWith('/go/'))
  .map((redirect) => ({ ...redirect, name: redirect.source.slice('/go/'.length) }));

const covered = goRedirects.filter(({ name }) => name in LINKS);

describe('vercel.json /go/* short links', () => {
  it('covers at least one LINKS entry, so the parity check is not vacuous', () => {
    expect(covered.length).toBeGreaterThan(0);
  });

  it.each(covered)('$source points at LINKS.$name', ({ name, destination }) => {
    expect(destination).toBe(LINKS[name as keyof typeof LINKS]);
  });
});

describe('LINKS', () => {
  it('has no two values that differ only by a trailing slash', () => {
    const values = Object.values(LINKS);
    const withoutTrailingSlash = values.map((url) => url.replace(/\/$/, ''));

    expect(new Set(withoutTrailingSlash).size).toBe(values.length);
  });
});
