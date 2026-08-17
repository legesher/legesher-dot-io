#!/usr/bin/env node
// Regenerates src/data/language-packs.json — the site's copy of which human
// languages ship a Legesher language pack, and what tier each one carries.
//
// WHY A GENERATED FILE, AND NOT A HAND-WRITTEN LIST
//
// The tier stamped on a language is a claim about how far that language has
// been reviewed, and the same claim is stamped on the published dataset. A
// hand-typed list on the website is how those two silently stop agreeing: the
// dataset re-exports, the site does not, and the site is then advertising a
// review standard the packs no longer hold. So the site's copy is derived,
// once, from the artifacts that decide the answer, and the derivation is
// re-runnable.
//
// INPUTS — both JSON, both produced by the packs monorepo, never edited here:
//
//   1. The language registry (`libs/i18n/legesher_i18n/languages.json`). Itself
//      generated from the translations database; carries each locale's name,
//      endonym, direction, and `status` — the tier.
//   2. The canon export manifest (`manifest.json`, written beside the parquet
//      files by the pack exporter). Carries the counts that actually ship:
//      locales, pack files, vocabulary rows, interpreter versions, and the
//      tier spread.
//
// Two inputs rather than one because neither alone is sufficient: the registry
// knows the languages, the manifest knows what was published about them. They
// are cross-checked against each other below, so a stale pairing fails here
// instead of rendering a wrong number.
//
// The parquet files are deliberately not read. Everything the site renders is
// in the manifest, and adding a parquet dependency to a static site build to
// re-derive numbers the exporter already reconciled would buy nothing.
//
// Both paths are required rather than guessed, because the wrong pairing is
// worse than no run at all:
//
//   npm run sync:languages -- \
//     --registry <monorepo>/libs/i18n/legesher_i18n/languages.json \
//     --manifest <monorepo>/build/hf-packs/manifest.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(REPO_ROOT, 'src/data/language-packs.json');

const USAGE =
  'Usage: npm run sync:languages -- \\\n' +
  '  --registry <monorepo>/libs/i18n/legesher_i18n/languages.json \\\n' +
  '  --manifest <monorepo>/build/hf-packs/manifest.json';

function parseArgs(argv) {
  const args = { registry: null, manifest: null };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]?.replace(/^--/, '');
    if (!(flag in args)) {
      throw new Error(`Unknown argument "${argv[i]}".\n${USAGE}`);
    }
    if (argv[i + 1] === undefined) throw new Error(`--${flag} needs a path.\n${USAGE}`);
    args[flag] = argv[i + 1];
  }
  for (const [flag, value] of Object.entries(args)) {
    if (!value) throw new Error(`--${flag} is required.\n${USAGE}`);
  }
  return args;
}

function readJson(label, path) {
  const absolute = resolve(REPO_ROOT, path);
  try {
    return JSON.parse(readFileSync(absolute, 'utf8'));
  } catch (error) {
    throw new Error(
      `Could not read the ${label} at ${absolute}.\n` +
        `Point --${label} at a checkout of the packs monorepo` +
        (label === 'manifest' ? ', running the pack export first if needed' : '') +
        `.\n  ${error.message}\n${USAGE}`
    );
  }
}

/** Fail loudly when the two inputs describe different exports. */
function crossCheck(registry, manifest) {
  const registryCodes = Object.keys(registry).sort();
  const manifestCodes = [...manifest.locales].sort();

  const onlyInRegistry = registryCodes.filter((c) => !manifestCodes.includes(c));
  const onlyInManifest = manifestCodes.filter((c) => !registryCodes.includes(c));
  if (onlyInRegistry.length || onlyInManifest.length) {
    throw new Error(
      'Registry and export manifest name different locales — one of them is stale.\n' +
        `  only in registry: ${onlyInRegistry.join(', ') || '(none)'}\n` +
        `  only in manifest: ${onlyInManifest.join(', ') || '(none)'}`
    );
  }

  if (manifest.counts.locales !== registryCodes.length) {
    throw new Error(
      `Manifest counts ${manifest.counts.locales} locales but names ${registryCodes.length}.`
    );
  }

  // The tier a language carries is read from the registry below, while the
  // headline "all of them are experimental" line is read from the manifest.
  // Proving the two agree here is what lets the pages trust either one.
  const derived = {};
  for (const code of registryCodes) {
    const tier = registry[code].status;
    if (!tier) throw new Error(`Language "${code}" carries no status in the registry.`);
    derived[tier] = (derived[tier] ?? 0) + 1;
  }
  const declared = manifest.tier_counts ?? {};
  const tiers = [...new Set([...Object.keys(derived), ...Object.keys(declared)])].sort();
  const disagreement = tiers.filter((tier) => derived[tier] !== declared[tier]);
  if (disagreement.length) {
    throw new Error(
      'Tier spread differs between the registry and the export manifest:\n' +
        disagreement
          .map((t) => `  ${t}: registry ${derived[t] ?? 0}, manifest ${declared[t] ?? 0}`)
          .join('\n')
    );
  }

  return derived;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readJson('registry', args.registry).languages;
  const manifest = readJson('manifest', args.manifest);

  const tierCounts = crossCheck(registry, manifest);

  const languages = Object.entries(registry)
    .map(([code, meta]) => ({
      code,
      name: meta.name,
      native: meta.native,
      rtl: Boolean(meta.rtl),
      tier: meta.status,
    }))
    // Sorted by English name so the rendered table needs no sort of its own.
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const data = {
    _comment:
      'GENERATED FILE — do not edit by hand. Regenerate with `npm run sync:languages`. ' +
      'Source: the language registry and the canon export manifest in the packs monorepo.',
    artifact: manifest.artifact,
    layer: manifest.layer,
    license: manifest.declared_license,
    counts: {
      locales: manifest.counts.locales,
      packFiles: manifest.counts.pack_files,
      vocabularyRows: manifest.counts.vocabulary_rows,
      pythonVersions: manifest.counts.python_versions,
    },
    tierCounts,
    languages,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  const spread = Object.entries(tierCounts)
    .map(([tier, count]) => `${count} ${tier}`)
    .join(', ');
  console.log(
    `Wrote ${OUTPUT}\n` +
      `  ${data.counts.locales} languages (${spread}), ` +
      `${data.counts.packFiles} pack files, ` +
      `${data.counts.vocabularyRows.toLocaleString('en-US')} rows`
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
