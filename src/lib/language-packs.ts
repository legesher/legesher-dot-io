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
  code: string;
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

/**
 * How the languages are actually distributed across the ladder, in words.
 *
 * Derived rather than written, because the honest sentence changes the day a
 * language is promoted, and a hand-written one would not. While every language
 * sits on a single rung the sentence says exactly that instead of implying a
 * spread that does not exist.
 */
export function tierSpreadSentence(): string {
  const present = TIER_LADDER.filter((stage) => (TIER_COUNTS[stage.tier] ?? 0) > 0);
  if (present.length === 1) {
    const [only] = present;
    return `All ${COUNTS.locales} languages are stamped ${only.tier}.`;
  }
  const parts = present.map((stage) => `${TIER_COUNTS[stage.tier]} ${stage.tier}`);
  const spread =
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  return `Of ${COUNTS.locales} languages: ${spread}.`;
}

/** 46512 -> '46,512' */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}
