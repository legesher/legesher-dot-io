// Single source for the install page: one entry per Legesher product, with
// the state of its install path today.
//
// The rule this file enforces (and products.test.ts checks): a product that is
// not live carries no install command and no install link. The page renders
// "Coming" for it and says so. A path that is not officially supported
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
  /** Labelling where it applies, e.g. community validation in progress. */
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
      'The vocabulary for writing Python in your language: one pack per language, published as an open dataset. The corpus of every word offered (language-corpus) and the canon of the words chosen (language-canon) are published beside it.',
    status: 'live',
    stage: 'Available, community validation in progress. Every pack is experimental today. Review by people who speak the language is what makes a pack official.',
    access: {
      label: 'Open the language-packs dataset',
      href: 'https://huggingface.co/datasets/legesher/language-packs',
    },
  },
  {
    id: 'toolchain',
    name: 'Command line and engine',
    summary:
      'The legesher command and the engine behind it. They read and write your code in your language, and the program runs exactly as it did.',
    status: 'coming',
    arrives: 'Published on PyPI with the public release.',
  },
  {
    id: 'vs-code',
    name: 'VS Code extension',
    summary:
      'Write in your language inside VS Code, with keywords, hover text and completions in every supported language.',
    status: 'coming',
    arrives: 'On the VS Code Marketplace after the command line reaches PyPI.',
  },
  {
    id: 'mcp-server',
    name: 'MCP server',
    summary:
      'Gives coding agents the words your team uses, so the code they write arrives in your language and follows your conventions.',
    status: 'coming',
    arrives: 'Published with the command line.',
  },
  {
    id: 'shared-map',
    name: 'Shared map',
    summary:
      'One map of the names in a codebase across languages, kept in version control, shared by the whole team and managed from the command line.',
    status: 'coming',
    arrives: 'Ships with the command line.',
  },
  {
    id: 'translation-api',
    name: 'Translation API',
    summary:
      'A hosted API that translates code between languages. Sign up, create a key, make your first call.',
    status: 'coming',
    arrives: 'Not yet open for signup.',
  },
] as const;
