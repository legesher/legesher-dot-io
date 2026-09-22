import { describe, expect, it } from 'vitest';
import { normalizeAttribution } from './attribution';

/** Number of combining marks (\p{M}) in a string. */
const countMarks = (value: string): number => (value.match(/\p{M}/gu) ?? []).length;

/**
 * True when the string contains an unpaired UTF-16 surrogate. Uses the
 * built-in check where the runtime has it and falls back to a code-unit scan,
 * which is why the fallback regex deliberately has no `u` flag.
 */
const hasLoneSurrogate = (value: string): boolean => {
  const isWellFormed = (value as { isWellFormed?: () => boolean }).isWellFormed;
  if (typeof isWellFormed === 'function') return !isWellFormed.call(value);
  return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);
};

// شُكْرًا, built from code points so the harakat are unmistakably present:
// each vowel sign is a mark (\p{M}) attached to the letter before it.
const arabicWithHarakat = String.fromCodePoint(
  0x0634, 0x064f, // sheen, damma
  0x0643, 0x0652, // kaf, sukun
  0x0631, 0x064b, // reh, fathatan
  0x0627,         // alef
);

// שָׁלוֹם in canonical mark order (qamats U+05B8 before shin dot U+05C1), so
// the fixture is already NFC and equality with the input is a real check.
const hebrewWithNiqqud = 'שָׁלוֹם';

describe('normalizeAttribution', () => {
  describe('keeps letters and combining marks of every script', () => {
    it.each([
      { script: 'Devanagari', input: 'हिन्दी', marks: 3 },
      { script: 'Sinhala', input: 'සිංහල', marks: 2 },
      { script: 'Tamil', input: 'தமிழ்', marks: 2 },
      { script: 'Bengali', input: 'বাংলা', marks: 3 },
      { script: 'Arabic with harakat', input: arabicWithHarakat, marks: 3 },
      { script: 'Hebrew with niqqud', input: hebrewWithNiqqud, marks: 3 },
      { script: 'Thai', input: 'ภาษาไทย', marks: 0 },
      { script: 'Thai with vowel signs', input: 'สวัสดี', marks: 2 },
    ])('$script: $input survives intact', ({ input, marks }) => {
      // Guard the fixture itself: it must already be NFC, otherwise the
      // function's own NFC step could reorder it and equality would be moot.
      expect(input.normalize('NFC')).toBe(input);
      expect(countMarks(input)).toBe(marks);

      const result = normalizeAttribution(input) as string;

      expect(result).toBe(input);
      expect(countMarks(result)).toBe(marks);
    });
  });

  describe('lowercases, then composes', () => {
    it('lowercases İstanbul to the NFC form of its lowercase mapping', () => {
      const result = normalizeAttribution('İstanbul') as string;

      // İ (U+0130) lowercases to i + U+0307. NFC has no composed form for
      // that pair, so the combining dot above survives as a mark.
      expect(result).toBe('i̇stanbul');
      expect(result).toBe('İstanbul'.toLowerCase().normalize('NFC'));
      expect(countMarks(result)).toBe(1);
    });

    it('composes a decomposed e + U+0301 into the precomposed U+00E9', () => {
      expect(normalizeAttribution('café')).toBe('café');
    });
  });

  describe('collapses everything outside letters, numbers and marks to a hyphen', () => {
    it('turns "Bridge Beta Launch" into bridge-beta-launch', () => {
      expect(normalizeAttribution('Bridge Beta Launch')).toBe('bridge-beta-launch');
    });

    it('removes bidi overrides, zero-width joiners, newlines and markup', () => {
      const result = normalizeAttribution('foo‮bar‍baz\nqux<script>') as string;

      expect(result).toBe('foo-bar-baz-qux-script');
      for (const forbidden of ['‮', '‍', '\n', '<', '>']) {
        expect(result).not.toContain(forbidden);
      }
    });

    it('keeps 日本語, "2026 日本 launch" and "2026 launch" distinct', () => {
      const results = ['日本語', '2026 日本 launch', '2026 launch'].map((value) =>
        normalizeAttribution(value),
      );

      expect(results).toEqual(['日本語', '2026-日本-launch', '2026-launch']);
      expect(new Set(results).size).toBe(results.length);
    });
  });

  describe('truncates by code point, not UTF-16 unit', () => {
    it('cuts 70 astral letters to 64 code points with no lone surrogate', () => {
      // U+1D518 is a letter outside the BMP: two code units each, and it
      // passes the allowlist, so only the length limit applies.
      const letter = '\u{1D518}';
      const input = letter.repeat(70);
      expect(input.length).toBe(140);

      const result = normalizeAttribution(input) as string;

      expect(result).toBe(letter.repeat(64));
      expect([...result].length).toBe(64);
      expect(hasLoneSurrogate(result)).toBe(false);
    });
  });

  describe('strips leading and trailing separators', () => {
    it.each([
      ['._-hello-_.', 'hello'],
      ['--bridge--', 'bridge'],
      ['  bridge  ', 'bridge'],
    ])('%j becomes %j', (input, expected) => {
      expect(normalizeAttribution(input)).toBe(expected);
    });

    it('returns undefined when only separators remain', () => {
      expect(normalizeAttribution('-._')).toBeUndefined();
      expect(normalizeAttribution('<>')).toBeUndefined();
    });
  });

  describe('returns undefined when nothing usable was supplied', () => {
    it.each([
      ['whitespace only', '   '],
      ['an empty string', ''],
      ['a number', 42],
      ['null', null],
      ['undefined', undefined],
      ['an object', { utm: 'x' }],
    ])('%s', (_label, input) => {
      expect(normalizeAttribution(input)).toBeUndefined();
    });
  });
});
