import { describe, expect, it } from 'vitest';
import registry from './language-registry.json';
import packSampleData from './pack-samples.json';

// language-registry.json and pack-samples.json are both generated from the
// language registry in legesher/legesher. A page that reads both needs them to
// describe the same languages; this fails when one is regenerated without the
// other.

const samples = new Map(packSampleData.samples.map((s) => [s.code, s]));
const WORDS = ['for', 'in', 'range', 'if', 'print', 'true', 'else', 'false'] as const;

describe('the registry extract', () => {
  it('lists each language once, by code and by tag', () => {
    const codes = registry.languages.map((l) => l.code);
    const tags = registry.languages.map((l) => l.tag);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('names a canonical language that it lists', () => {
    expect(registry.languages.map((l) => l.code)).toContain(registry.canonical);
  });

  it('describes the same languages as the pack samples', () => {
    expect(registry.languages.map((l) => l.code).sort()).toEqual([...samples.keys()].sort());
  });
});

describe.each(registry.languages.map((l) => [l.code, l] as const))('%s', (code, language) => {
  it('agrees with its pack sample on writing direction', () => {
    expect(samples.get(code)?.dir).toBe(language.rtl ? 'rtl' : 'ltr');
  });

  it('has a pack sample with every word the page shows', () => {
    const words = samples.get(code)?.words as Record<string, string> | undefined;
    for (const word of WORDS) expect(words?.[word]?.trim(), word).toBeTruthy();
  });
});
