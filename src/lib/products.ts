// Single source for the install page: one entry per Legesher product, with
// the state of its install path today.
//
// The rule this file enforces (installPathProblems below, checked by
// products.test.ts): a product that is not live carries no install command, no
// install link and no install steps. The page renders "Coming" for it and says
// so. A path that is not officially supported never appears on the site, even
// when a name happens to resolve on a registry.
//
// Two kinds of product. An 'account' product is reached through a Legesher
// account; once one is live the page leads with it. An 'open-source' product
// installs from a public registry with no account, and links to its source.
//
// No version strings live here. A live product links to the surface that
// carries its own current version (a dataset page, a listing), so nothing on
// the site can go stale when a release ships.

export type ProductStatus = 'live' | 'coming';
export type ProductKind = 'account' | 'open-source';

export interface ProductLink {
  label: string;
  href: string;
}

/** A short silent recording of the product in use, shown at the top of its entry. */
export interface ProductDemo {
  /** Site path of the recording, under /install/. */
  video: string;
  /** Site path of the still shown before the recording plays. */
  poster: string;
  /** What the recording shows, in words, for a reader who cannot see it. */
  label: string;
}

export interface Product {
  /** Stable id, used as the section anchor on the page. */
  id: string;
  name: string;
  /** One or two sentences: what it is and who it is for. */
  summary: string;
  status: ProductStatus;
  kind: ProductKind;
  /** Labelling where it applies, e.g. community validation in progress. */
  stage?: string;
  /** Where to get it. Required when live, forbidden otherwise. */
  access?: ProductLink;
  /** Further places the same release is published, e.g. a second registry. Live products only. */
  alsoAt?: readonly ProductLink[];
  /** Where the source code is. Required on a live open-source product, forbidden on one that is not live. */
  source?: ProductLink;
  /**
   * The steps between the link and the first command, in order. Required on a
   * live account product, forbidden on a product that is not live.
   */
  steps?: readonly string[];
  /**
   * Copy-paste install commands, each verified on a clean machine before it
   * ships here. Forbidden on a product that is not live.
   */
  commands?: readonly string[];
  /** The product in use. Live products only: nothing is shown running before it can be installed. */
  demo?: ProductDemo;
  /** For a product that is not live: what it is waiting on, in plain words. */
  arrives?: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'language-packs',
    name: 'Language packs',
    kind: 'open-source',
    summary:
      'The vocabulary for writing Python in your language: one pack per language, published as an open dataset. The corpus of every word offered (language-corpus) and the canon of the words chosen (language-canon) are published beside it.',
    status: 'live',
    stage: 'Available, community validation in progress. Every pack is experimental today. Review by people who speak the language is what makes a pack official.',
    access: {
      label: 'Open the language-packs dataset',
      href: 'https://huggingface.co/datasets/legesher/language-packs',
    },
    source: {
      label: 'Source on GitHub',
      href: 'https://github.com/legesher/language-packs',
    },
    demo: {
      video: '/install/language-packs.mp4',
      poster: '/install/language-packs.jpg',
      label: 'The line print("hello world") written in many languages, each using its own word for print. One line lights up at a time.',
    },
  },
  {
    id: 'toolchain',
    name: 'Command line and engine',
    kind: 'open-source',
    summary:
      'The legesher command and the engine behind it. They read and write your code in your language, and the program runs exactly as it did.',
    status: 'live',
    stage: 'Alpha. Every language pack comes with it.',
    access: {
      label: 'Open legesher on PyPI',
      href: 'https://pypi.org/project/legesher/',
    },
    source: {
      label: 'Source on GitHub',
      href: 'https://github.com/legesher/legesher',
    },
    demo: {
      video: '/install/command-line.mp4',
      poster: '/install/command-line.jpg',
      label: 'A terminal. The legesher command translates hello.py to Hindi, shows the Hindi file, and runs it. The program prints the same two lines as before.',
    },
    commands: ['pip install legesher'],
  },
  {
    id: 'vs-code',
    name: 'VS Code extension',
    kind: 'open-source',
    summary:
      'Write in your language inside VS Code, with keywords, hover text and completions in every supported language.',
    status: 'live',
    stage:
      'Preview. The second command installs the language server, which brings hover text, completions and diagnostics.',
    access: {
      label: 'Open it on the VS Code Marketplace',
      href: 'https://marketplace.visualstudio.com/items?itemName=legesher.legesher-vscode',
    },
    alsoAt: [
      {
        label: 'Open it on Open VSX, for VSCodium and Cursor',
        href: 'https://open-vsx.org/extension/legesher/legesher-vscode',
      },
    ],
    source: {
      label: 'Source on GitHub',
      href: 'https://github.com/legesher/legesher/tree/main/libs/vs-code',
    },
    demo: {
      video: '/install/vs-code.mp4',
      poster: '/install/vs-code.jpg',
      label: 'VS Code with a Python file open. The Legesher translation panel opens and shows the file in English and in Hindi, side by side.',
    },
    commands: ['code --install-extension legesher.legesher-vscode', 'pip install legesher-language-server'],
  },
  {
    id: 'mcp-server',
    name: 'MCP server',
    kind: 'open-source',
    summary:
      'Gives coding agents the words your team uses, so the code they write arrives in your language and follows your conventions.',
    status: 'live',
    stage:
      'Alpha. Your MCP client starts the server with this command. The setup for Claude, Cursor, VS Code and Zed is on the package page.',
    access: {
      label: 'Open legesher-mcp on PyPI',
      href: 'https://pypi.org/project/legesher-mcp/',
    },
    source: {
      label: 'Source on GitHub',
      href: 'https://github.com/legesher/legesher/tree/main/libs/mcp',
    },
    demo: {
      video: '/install/mcp-server.mp4',
      poster: '/install/mcp-server.jpg',
      label: 'An MCP client lists the six tools of the server, then calls translate_to_native on a two-line program. The program comes back in Swahili.',
    },
    commands: ['uvx legesher-mcp'],
  },
  {
    id: 'translation-api',
    name: 'Translation API',
    kind: 'account',
    summary:
      'A hosted API that translates code between languages. Sign up, create a key, make your first call.',
    status: 'coming',
    arrives: 'Not yet open for signup.',
  },
] as const;

const VERSION_STRING = /\bv?\d+\.\d+(\.\d+)?\b/;

function linkProblems(what: string, link: ProductLink | undefined): string[] {
  if (!link) return [];
  const problems: string[] = [];
  if (!/^https:\/\//.test(link.href)) problems.push(`${what} is not an https link`);
  if (!link.label.trim()) problems.push(`${what} has no label`);
  return problems;
}

/**
 * Every way one entry breaks the install-path rule, in words; empty when it
 * breaks none. products.test.ts runs it over PRODUCTS and over entries written
 * to break one rule each, so the guard is exercised whatever the registry holds.
 */
export function installPathProblems(product: Product): string[] {
  const problems: string[] = [];
  const links: [string, ProductLink | undefined][] = [
    ['the install link', product.access],
    ...(product.alsoAt ?? []).map((link): [string, ProductLink] => ['a further link', link]),
    ['the source link', product.source],
  ];

  if (product.status !== 'live') {
    if (product.commands) problems.push('advertises an install command while not live');
    if (links.some(([, link]) => link)) problems.push('advertises an install link while not live');
    if (product.steps) problems.push('advertises install steps while not live');
    if (product.demo) problems.push('shows a demo while not live');
    if (!product.arrives?.trim()) problems.push('does not say what it is waiting on');
    return problems;
  }

  if (!product.access) problems.push('is live with no install link');
  for (const [what, link] of links) problems.push(...linkProblems(what, link));
  if (product.kind === 'open-source' && !product.source) {
    problems.push('is open source and live with no source link');
  }
  if (product.kind === 'account' && !product.steps?.length) {
    problems.push('is reached through an account and live with no steps');
  }
  if (product.kind === 'account' && !product.commands?.length) {
    problems.push('is reached through an account and live with no first command');
  }
  if (product.arrives) problems.push('is live and still says what it is waiting on');
  if (product.demo) {
    for (const [what, path] of [['the demo recording', product.demo.video], ['the demo still', product.demo.poster]]) {
      if (!/^\/install\/[a-z0-9-]+\.[a-z0-9]+$/.test(path)) problems.push(`${what} is not a file under /install/`);
    }
    if (!product.demo.label.trim()) problems.push('the demo has no description in words');
  }

  // Commands included: a pinned install (`pip install legesher==1.2.3`) goes stale at the next release.
  const text = [
    product.summary,
    product.stage ?? '',
    ...links.map(([, link]) => link?.label ?? ''),
    ...(product.steps ?? []),
    ...(product.commands ?? []),
    product.demo?.label ?? '',
  ].join(' ');
  if (VERSION_STRING.test(text)) problems.push('carries a hand-typed version string');

  return problems;
}
