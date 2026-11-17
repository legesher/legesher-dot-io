import { describe, expect, it } from 'vitest';
import registry from '../language-registry.json';
import { languageFor } from './match';

// languageFor turns a requested language (from ?lang= or the browser) into a
// registry code, or nothing. The page then says the language is the one "your
// browser asks for", so a match in the wrong script is a false statement.

const languages = registry.languages.filter((l) => l.code !== registry.canonical);

describe('every registry language can be asked for', () => {
  it.each(languages.map((l) => [l.code, l.tag] as const))('%s, by its code and by its tag %s', (code, tag) => {
    expect(languageFor(code, languages)).toBe(code);
    expect(languageFor(tag, languages)).toBe(code);
    expect(languageFor(tag.toUpperCase(), languages)).toBe(code);
  });
});

describe('languageFor', () => {
  it.each([
    ['pt-BR', 'pt'],
    ['nb-NO', 'no'],
    ['fil-PH', 'tl'],
    ['zh-Hans-CN', 'zh'],
    ['sr-Cyrl-RS', 'sr'],
    // A region with no script names the script it is usually written in.
    ['zh-CN', 'zh'],
    ['zh-SG', 'zh'],
    ['sr-RS', 'sr'],
    ['mn-MN', 'mn'],
    ['uz-UZ', 'uz'],
  ])('matches %s to %s', (requested, code) => {
    expect(languageFor(requested, languages)).toBe(code);
  });

  it.each(['zh-TW', 'zh-HK', 'zh-Hant', 'sr-Latn', 'sr-ME', 'uz-Cyrl', 'uz-AF', 'mn-Mong', 'mn-CN'])(
    'does not match %s to a pack in another script',
    (requested) => {
      expect(languageFor(requested, languages)).toBeUndefined();
    },
  );

  it('does not match a language with no pack, or the canonical language left out of the list', () => {
    expect(languageFor('kl', languages)).toBeUndefined();
    expect(languageFor(registry.canonical, languages)).toBeUndefined();
    expect(languageFor('', languages)).toBeUndefined();
  });
});
