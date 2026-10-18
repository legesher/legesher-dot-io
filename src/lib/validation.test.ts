import { describe, expect, it } from 'vitest';
import { EMAIL_REGEX, NAME_REGEX } from './validation';

describe('NAME_REGEX', () => {
  it.each(['José', 'Ólafur', '李伟', "O'Brien", 'Anne-Marie', 'Mary Jane', 'שלום'])(
    'accepts %s',
    (name) => {
      expect(NAME_REGEX.test(name)).toBe(true);
    },
  );

  // Combining marks are category \p{M}, not \p{L}: every vowel sign, virama,
  // niqqud and haraka. A class built from \p{L} alone rejects most Indic,
  // Sinhala, Thai, pointed Hebrew and vocalised Arabic names while Latin, Han
  // and Hangul pass, which is why the defect survived (CORE-2180).
  it.each([
    ['हिन्दी', 'Devanagari with vowel signs and a virama'],
    ['राम', 'Devanagari with a vowel sign'],
    ['ශ්‍රී', 'Sinhala with a virama and the zero-width joiner the conjunct needs'],
    ['שָׁלוֹם', 'Hebrew with niqqud'],
    ['مُحَمَّد', 'Arabic with harakat and shadda'],
    ['สมศักดิ์', 'Thai with a vowel sign above and a thanthakhat'],
    ['明美', 'CJK'],
  ])('accepts %s (%s)', (name) => {
    expect(NAME_REGEX.test(name)).toBe(true);
  });

  it.each([
    ['李', 'a one-character CJK given name'],
    ['a', 'a one-character Latin given name'],
  ])('accepts %s (%s)', (name) => {
    expect(NAME_REGEX.test(name)).toBe(true);
  });

  it('accepts a name of exactly 150 characters', () => {
    expect(NAME_REGEX.test('x'.repeat(150))).toBe(true);
  });

  it.each([
    ['a 151-character name', 'x'.repeat(151)],
    ['markup', '<b>'],
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['a tab inside the name', 'Anne\tMarie'],
    ['a line break inside the name', 'Anne\nMarie'],
    ['punctuation only', "-'"],
    ['digits', 'R2D2'],
  ])('rejects %s', (_label, name) => {
    expect(NAME_REGEX.test(name)).toBe(false);
  });

  // Format characters (\p{Cf}) stay out, with the two exceptions above that
  // some scripts need inside a word. Bidi controls can reorder what a reader
  // sees (Trojan Source), and the invisible ones hide payload in plain text.
  it.each([
    ['a right-to-left override', 'abc‮def'],
    ['a left-to-right embedding', '‪abc'],
    ['a right-to-left isolate', '⁧abc⁩'],
    ['a left-to-right mark', 'abc‎'],
    ['an Arabic letter mark', '؜محمد'],
    ['a byte order mark', '﻿abc'],
    ['a soft hyphen', 'ab­c'],
    ['a word joiner', 'ab⁠c'],
    ['a zero-width space', 'ab​c'],
    ['a zero-width joiner on its own', '‍'],
    ['a zero-width joiner with no letter', '‍‌'],
  ])('rejects %s', (_label, name) => {
    expect(NAME_REGEX.test(name)).toBe(false);
  });
});

describe('EMAIL_REGEX', () => {
  it.each(['user@example.com', 'first.last+tag@sub.example.co', 'a@b.io'])(
    'accepts %s',
    (email) => {
      expect(EMAIL_REGEX.test(email)).toBe(true);
    },
  );

  it.each([
    ['a missing domain', 'user@'],
    ['a missing local part', '@example.com'],
    ['a host without a dot', 'user@localhost'],
    ['a space instead of @', 'user example.com'],
    ['a one-letter top-level domain', 'user@example.c'],
    ['a trailing newline', 'user@example.com\n'],
    ['an empty string', ''],
  ])('rejects %s', (_label, email) => {
    expect(EMAIL_REGEX.test(email)).toBe(false);
  });
});
