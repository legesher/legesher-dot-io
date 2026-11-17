import { describe, expect, it } from 'vitest';
import registry from '../language-registry.json';
import { en, type Copy } from './copy';

// The words of the "life of a language" page. The page renders whatever this
// object holds, so the rules the page depends on are checked here.

/** Every string the copy can render, with its path. Functions are called with sample counts. */
function strings(value: unknown, path = 'en'): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') {
    return [0, 1, 2, 8].flatMap((n) => strings((value as (...a: number[]) => unknown)(n, 8), `${path}(${n})`));
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  }
  return [];
}

const all = strings(en);

describe('the stages', () => {
  it('are eight, with unique ids', () => {
    expect(en.stages).toHaveLength(8);
    expect(new Set(en.stages.map((s) => s.id)).size).toBe(8);
  });

  it.each(en.stages.map((s) => [s.id, s] as const))('%s answers what happens, who does it and what you can do', (_, stage) => {
    for (const field of ['title', 'lead', 'what', 'who', 'you'] as const) {
      expect(stage[field].trim(), field).not.toBe('');
    }
  });

  it.each(Object.keys(en.tiers))('the %s tier belongs to exactly one stage', (tier) => {
    expect(en.stages.filter((s) => s.tier === tier)).toHaveLength(1);
  });
});

describe('the words', () => {
  it('hold no em dash or en dash', () => {
    const dashed = all.filter(([, text]) => /[\u2013\u2014]/.test(text)).map(([path]) => path);
    expect(dashed).toEqual([]);
  });

  it('never type the number of languages; the page computes it from the registry', () => {
    const count = String(registry.languages.length);
    const typed = all.filter(([path, text]) => !path.includes('(') && new RegExp(`\\b${count}\\b`).test(text));
    expect(typed.map(([path]) => path)).toEqual([]);
  });

  it('name only the contact addresses the site uses', () => {
    const addresses = all.flatMap(([, text]) => text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []);
    for (const address of addresses) {
      expect(['support@legesher.com', 'contribute@legesher.com', 'hello@legesher.com']).toContain(address);
    }
  });

  it('use the three public tier names', () => {
    const names = Object.values(en.tiers).map((t: Copy['tiers'][keyof Copy['tiers']]) => t.name);
    expect(names).toEqual(['Experimental', 'Reviewed', 'Official']);
  });
});
