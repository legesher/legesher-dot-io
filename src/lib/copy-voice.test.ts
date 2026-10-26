// Copy voice guard. docs/voice.md is the rule; this file is the check.
//
// Every page, every layout, every component and the product registry behind
// the install page are scanned, line by line, for the marks the guide rejects:
// an em dash, a contact address outside the six public aliases, and the words
// under "Words and patterns the guard rejects". Comments are scanned too; a
// word that should not reach a visitor should not sit one copy-paste away.
//
// Files written before the guard existed are the `it.fails` ledger below. Each
// entry names the ticket that recuts the file. The entry holds while the file
// still fails and turns red the day the file is fixed, so the ledger can only
// shrink: remove the entry in the same change that fixes the file.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// The six addresses docs/voice.md allows on the site, by purpose.
const PUBLIC_ADDRESSES = new Set(
  ["contribute", "support", "privacy", "security", "legal", "hello"].map(
    (alias) => `${alias}@legesher.com`,
  ),
);
const ANY_LEGESHER_ADDRESS = /\b[a-z0-9._-]+@legesher\.(?:com|io)\b/gi;

// One entry per rejected word or mark, in the order docs/voice.md lists them.
const REJECTED: ReadonlyArray<readonly [string, RegExp]> = [
  ["em dash", /—|&mdash;|&#8212;|&#x2014;/i],
  ["plainly", /\bplainly\b/i],
  ["deliberate(ly)", /\bdeliberate(?:ly)?\b/i],
  ["honest about", /\bhonest about\b/i],
  ["honestly", /\bhonestly\b/i],
  ["stand behind", /\bstands? behind\b/i],
  ["on purpose", /\bon purpose\b/i],
  ["by design", /\bby design\b/i],
  ["that is the point", /\bthat(?:'s| is) the point\b/i],
  ["worth noting", /\bworth noting\b/i],
  ["worth saying", /\bworth saying\b/i],
  ["no questions asked", /\bno questions asked\b/i],
  ["game-changer", /\bgame[- ]chang(?:er|ing)\b/i],
  ["seamless", /\bseamless(?:ly)?\b/i],
  ["robust", /\brobust(?:ly|ness)?\b/i],
  ["leverage", /\bleverag(?:e|es|ed|ing)\b/i],
  ["delve", /\bdelv(?:e|es|ed|ing)\b/i],
  ["unlock", /\bunlock(?:s|ed|ing)?\b/i],
  ["elevate", /\belevat(?:e|es|ed|ing)\b/i],
  ["supercharge", /\bsupercharg(?:e|es|ed|ing)\b/i],
  ["effortless", /\beffortless(?:ly)?\b/i],
  ["cutting-edge", /\bcutting[- ]edge\b/i],
  ["state-of-the-art", /\bstate[- ]of[- ]the[- ]art\b/i],
  ["demystify", /\bdemystif(?:y|ies|ied|ying)\b/i],
];

// Files that predate the guard, with the ticket that recuts each one.
const LEDGER: ReadonlyMap<string, string> = new Map([
  ["src/components/Features.astro", "CORE-1495"],
  ["src/components/Hero.astro", "CORE-1495"],
  ["src/components/Newsletter.astro", "CORE-1495"],
  ["src/pages/privacy.astro", "CORE-2505"],
  ["src/pages/terms.astro", "CORE-2505"],
]);

type Finding = { rule: string; line: number; text: string };

function walk(dir: string, keep: (file: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path, keep);
    return keep(path) ? [path] : [];
  });
}

const isAstro = (file: string) => file.endsWith(".astro");

// Everything a visitor can read: pages, the layout shell, the section
// components (the shadcn primitives under ui/ carry no copy), and the product
// registry the install page renders. Parametrized from the tree, never a
// frozen list, so a page added later is checked the moment it exists.
function copyFiles(): string[] {
  const pages = walk(join(ROOT, "src/pages"), isAstro);
  const layouts = walk(join(ROOT, "src/layouts"), isAstro);
  const components = walk(join(ROOT, "src/components"), isAstro).filter(
    (file) => !file.includes(`${join("src/components", "ui")}/`),
  );
  const products = join(ROOT, "src/lib/products.ts");
  const all = [...pages, ...layouts, ...components, ...(existsSync(products) ? [products] : [])];
  return all.map((file) => relative(ROOT, file)).sort();
}

function findings(path: string): Finding[] {
  const lines = readFileSync(join(ROOT, path), "utf8").split("\n");
  const out: Finding[] = [];
  lines.forEach((text, index) => {
    const line = index + 1;
    for (const [rule, pattern] of REJECTED) {
      if (pattern.test(text)) out.push({ rule, line, text: text.trim() });
    }
    for (const match of text.matchAll(ANY_LEGESHER_ADDRESS)) {
      const address = match[0].toLowerCase();
      if (!PUBLIC_ADDRESSES.has(address)) {
        out.push({ rule: `contact address ${address}`, line, text: text.trim() });
      }
    }
  });
  return out;
}

const FILES = copyFiles();

describe("copy voice guard (docs/voice.md)", () => {
  it("scans the pages every branch carries, so the guard is never vacuous", () => {
    expect(FILES).toEqual(
      expect.arrayContaining(["src/pages/index.astro", "src/pages/privacy.astro", "src/pages/terms.astro"]),
    );
  });

  it("names only files that exist in the ledger", () => {
    for (const path of LEDGER.keys()) expect(FILES, `${path} is in the ledger but not in the tree`).toContain(path);
  });

  for (const path of FILES) {
    const ticket = LEDGER.get(path);
    const check = () => {
      const found = findings(path);
      const report = found.map((f) => `${path}:${f.line} (${f.rule}): ${f.text}`).join("\n");
      expect(found, `${path} carries copy docs/voice.md rejects:\n${report}`).toEqual([]);
    };
    if (ticket) {
      it.fails(`${path} is recut under ${ticket} and fails until then`, check);
    } else {
      it(`${path} carries no rejected word, em dash or non-public contact address`, check);
    }
  }
});
