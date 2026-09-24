// Attribution values come from UTM parameters on the landing URL, so they are
// client-supplied and untrusted. They are normalized to a slug rather than
// validated-and-discarded: a campaign named "Bridge Beta Launch" demonstrably
// acquired the subscriber, and rejecting it for containing spaces would lose
// attribution the campaign earned.
//
// Returns undefined when nothing usable was supplied, so the caller can omit
// the key entirely. Writing a placeholder instead would make "we never measured
// this" indistinguishable from "we measured it as direct".
// Letters, numbers and COMBINING MARKS of any script survive. NAME_REGEX in
// validation.ts does not yet keep marks (tracked as CORE-2180). An ASCII-only
// slug would erase a campaign named 日本語 to nothing and collapse
// "2026 日本 Launch" and "2026 Launch" to one value.
//
// \p{M} is not optional decoration: without it, हिन्दी becomes "ह-न-द" and
// සිංහල becomes "ස-හල", because every vowel sign and virama is a mark rather
// than a letter. Dropping marks silently destroys most Indic, Sinhala, Thai,
// Hebrew and vocalised Arabic text while leaving Latin, Han and Hangul intact
// — which is precisely the failure this project exists to prevent.
//
// Everything outside the allowlist collapses to '-', so control characters,
// bidi overrides (U+202E), zero-width joiners and newlines cannot survive:
// they are format characters (\p{Cf}), not marks.
export function normalizeAttribution(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .trim()
    .toLowerCase()
    // Compose after lowercasing, which can decompose (İ becomes i + U+0307),
    // so equivalent spellings settle on one form before being stored. The
    // order matters: J + U+030C only composes to ǰ (U+01F0) after J has
    // become j, because no precomposed J with caron exists. (Do not write
    // the bare word for that case in this comment: Tailwind scans this file
    // and would emit the matching utility class into the shipped stylesheet.)
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\p{M}._-]+/gu, '-');
  // Slice by code point rather than UTF-16 unit: a plain .slice() can cut a
  // surrogate pair in half and leave an unpaired surrogate.
  const truncated = Array.from(normalized).slice(0, 64).join('');
  return truncated.replace(/^[-._]+|[-._]+$/gu, '') || undefined;
}
