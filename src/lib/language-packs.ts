// Everything the site says about which languages ship and how far each one has
// been reviewed, read from one generated file.
//
// `src/data/language-packs.json` is produced by `npm run sync:languages` from
// the language registry and the pack export's own manifest — the same two
// inputs the published dataset is built from. Nothing here retypes a figure:
// the counts, the tier of each language, and the sentence describing the spread
// across tiers are all derived, so the site cannot claim a review standard the
// packs do not hold.
import data from '@/data/language-packs.json';

export type Tier = 'experimental' | 'reviewed' | 'official';

export interface LanguageEntry {
  /** Registry key. The pack identifier — what you install and what the dataset keys on. */
  code: string;
  /** BCP 47 tag. Differs from `code` where a script subtag is needed (`zh` -> `zh-Hans`). */
  bcp47: string;
  name: string;
  native: string;
  rtl: boolean;
  tier: Tier;
}

export const LANGUAGES = data.languages as LanguageEntry[];
export const COUNTS = data.counts;
export const TIER_COUNTS = data.tierCounts as Partial<Record<Tier, number>>;
/** SPDX identifier as declared by the export, e.g. 'apache-2.0'. */
export const LICENSE = data.license;

/**
 * The ladder, in order.
 *
 * `asserts` and `withholds` are held to the wording of the maturity ladder the
 * packs themselves document and the dataset card renders. A paraphrase here
 * would read as a second, subtly different promise about the same stamp.
 */
export const TIER_LADDER: {
  tier: Tier;
  asserts: string;
  withholds: string;
}[] = [
  {
    tier: 'experimental',
    asserts:
      'Machine-drafted, then curated by maintainers and passed through the mechanical gates: identifier validity, cross-section collision checks, Unicode normalization, schema validation, and a regeneration check proving the shipped pack matches its source of truth.',
    withholds: 'That any native speaker has seen it.',
  },
  {
    tier: 'reviewed',
    /**
     * Singular and in this exact form everywhere it appears on the site: this
     * is the ladder's own phrasing, and "speakers have endorsed it" elsewhere
     * would read as a second, stricter bar than the one actually documented.
     */
    asserts: 'A native speaker of the language has reviewed the pack and signed off on it.',
    withholds:
      'That the terminology has been screened for offensive or unfortunate readings.',
  },
  {
    tier: 'official',
    asserts:
      'Certified review plus term screening: a convened session ratifies the pack, and the terminology has been checked for offensive or unfortunate readings.',
    withholds: '—',
  },
];

/** 'experimental → reviewed → official' */
export const TIER_SEQUENCE = TIER_LADDER.map((stage) => stage.tier).join(' → ');

/** The rungs that actually have languages on them, in ladder order. */
export const TIERS_PRESENT: Tier[] = TIER_LADDER.filter(
  (stage) => (TIER_COUNTS[stage.tier] ?? 0) > 0
).map((stage) => stage.tier);

/**
 * The one tier every language currently carries, or null once they are spread.
 *
 * The pages use this to gate the paragraphs that only make sense while the
 * whole set sits on a single rung — "no native speaker has signed off", "no
 * criterion has been exercised yet". Those sentences are true today and become
 * false the first time a language is promoted, and a promotion is a data change
 * that reaches the site without anyone editing prose. Gating them means the
 * page loses a paragraph rather than contradicting the table above it.
 */
export const ONLY_TIER: Tier | null = TIERS_PRESENT.length === 1 ? TIERS_PRESENT[0] : null;

/** True while nothing has been promoted off the bottom rung. */
export const ALL_EXPERIMENTAL = ONLY_TIER === 'experimental';

/**
 * How the languages are actually distributed across the ladder, in words.
 *
 * Derived rather than written, because the honest sentence changes the day a
 * language is promoted, and a hand-written one would not. While every language
 * sits on a single rung the sentence says exactly that instead of implying a
 * spread that does not exist.
 */
export function tierSpreadSentence(): string {
  const parts = TIERS_PRESENT.map((tier) => `${TIER_COUNTS[tier]} ${tier}`);
  // Unreachable with real data — a generated file with no languages in it would
  // have failed the sync script's cross-check — but a sentence is a poor place
  // to discover that, so say nothing rather than "Of 0 languages: undefined."
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return `All ${COUNTS.locales} languages are stamped ${TIERS_PRESENT[0]}.`;
  }
  const spread = `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  return `Of ${COUNTS.locales} languages: ${spread}.`;
}

/**
 * Whether an endonym is written in the Arabic script.
 *
 * Derived from the string rather than from a list of locales, because the
 * property being tested is "which glyphs does this cell need", and the registry
 * records no script field to read instead. globals.css defines `.font-arabic`
 * (Noto Sans Arabic); the body font covers no Arabic glyphs, so without this
 * the endonym falls back to whatever the OS happens to have.
 */
// Arabic, Arabic Supplement, Arabic Extended-A/B, and the two presentation-form
// blocks. Escaped rather than written literally so the ranges stay readable and
// cannot be mangled by an editor that reorders bidirectional text.
const ARABIC_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u0870-\u089F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;

export function usesArabicScript(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

/** 46512 -> '46,512' */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
