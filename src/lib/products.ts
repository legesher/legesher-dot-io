// Single source for the install page: one entry per Legesher product, with
// the honest state of its install path today.
//
// The rule this file enforces (and products.test.ts checks): a product that is
// not live carries no install command and no install link. The page renders
// "Coming" for it and says so plainly. A path that is not officially supported
// never appears on the site, even when a name happens to resolve on a registry.
//
// No version strings live here. A live product links to the surface that
// carries its own current version (a dataset page, a listing), so nothing on
// the site can go stale when a release ships.

export type ProductStatus = 'live' | 'coming';

export interface Product {
  /** Stable id, used as the section anchor on the page. */
  id: string;
  name: string;
  /** One or two sentences: what it is and who it is for. */
  summary: string;
  status: ProductStatus;
  /** Honest labelling where it applies, e.g. community validation in progress. */
  stage?: string;
  /** Where to get it. Required when live, forbidden otherwise. */
  access?: { label: string; href: string };
  /**
   * Copy-paste install commands, each verified on a clean machine before it
   * ships here. Forbidden on a product that is not live.
   */
  commands?: readonly string[];
  /** For a product that is not live: what it is waiting on, in plain words. */
  arrives?: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'language-packs',
    name: 'Language packs',
    summary:
      'The vocabulary Legesher ships for each supported language: one pack per language, one pinned revision per release, published as an open dataset. The evidence behind every pack (language-corpus) and the current decision per language (language-canon) are published alongside it.',
    status: 'live',
    stage: 'Available, community validation in progress. Every pack is at the experimental tier today; native-speaker review moves a language up the ladder.',
    access: {
      label: 'Browse the language-packs dataset',
      href: 'https://huggingface.co/datasets/legesher/language-packs',
    },
  },
  {
    id: 'toolchain',
    name: 'Toolchain: command line and engine',
    summary:
      'The legesher command line and the engine behind it, which read and write code in your language without changing how the program runs.',
    status: 'coming',
    arrives: 'Arrives on PyPI with the public release. There is no supported install path before then.',
  },
  {
    id: 'vs-code',
    name: 'VS Code extension',
    summary:
      'Code in your language inside VS Code: localized keywords, hover text and completions, with every supported language selectable.',
    status: 'coming',
    arrives: 'Lands on the VS Code Marketplace after the toolchain reaches PyPI.',
  },
  {
    id: 'mcp-server',
    name: 'MCP server',
    summary:
      'Gives coding agents the vocabulary your team uses, so the code they generate arrives in your language and your conventions.',
    status: 'coming',
    arrives: 'Published alongside the toolchain.',
  },
  {
    id: 'shared-map',
    name: 'Shared map',
    summary:
      'A versioned map of the names in a codebase across languages, shared by the whole team and driven from the toolchain command line.',
    status: 'coming',
    arrives: 'Ships with the toolchain.',
  },
  {
    id: 'translation-api',
    name: 'Translation API',
    summary:
      'A hosted API for translating code between languages: sign up, create a key, make a first call.',
    status: 'coming',
    arrives: 'Not yet open for signup.',
  },
] as const;
