import { describe, expect, it } from 'vitest';
import { EMAIL_REGEX, NAME_REGEX } from './validation';

describe('NAME_REGEX', () => {
  it.each(['José', 'Ólafur', '李伟', "O'Brien", 'Anne-Marie', 'Mary Jane', 'שלום'])(
    'accepts %s',
    (name) => {
      expect(NAME_REGEX.test(name)).toBe(true);
    },
  );

  it('accepts a name of exactly 150 characters', () => {
    expect(NAME_REGEX.test('x'.repeat(150))).toBe(true);
  });

  it.each([
    ['a single letter', 'a'],
    ['a 151-character name', 'x'.repeat(151)],
    ['markup', '<b>'],
    ['an empty string', ''],
  ])('rejects %s', (_label, name) => {
    expect(NAME_REGEX.test(name)).toBe(false);
  });

  // These pin what the regex does today, not what it should do. The character
  // class is \p{L} only, so a name that needs a combining mark (\p{M}) is
  // rejected: Devanagari vowel signs and viramas, Hebrew niqqud, Arabic
  // harakat. The {2,150} floor separately rejects one-character given names.
  // Changing the regex is a product decision outside this file; a deliberate
  // fix will turn these red, which is the point.
  describe('documents current limits', () => {
    it.each([
      ['हिन्दी', 'Devanagari with vowel signs and a virama'],
      ['राम', 'Devanagari with a vowel sign'],
      ['שָׁלוֹם', 'Hebrew with niqqud'],
    ])('rejects %s (%s)', (name) => {
      expect(NAME_REGEX.test(name)).toBe(false);
    });

    it('rejects the one-character name 李', () => {
      expect(NAME_REGEX.test('李')).toBe(false);
    });
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
