import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The subscribe route must read BUTTONDOWN_API_KEY at request time. Astro's
// build replaces a build-time environment read with a literal, which either
// bakes the secret into the deployed function or, when the variable is absent
// at build time, ships an endpoint that fails every request. Worse, the
// replacement plugin inlines every private variable whose name appears in a
// module that contains the bare accessor anywhere, comments included. So the
// accessor is banned outright from every source under src, the route must
// read the key through astro:env, and nothing may type the key back onto the
// banned accessor (CORE-2193). The build-time proof is the sentinel build in
// the PR body; this guard is the cheap, always-on half.

const root = join(import.meta.dirname, '..', '..');
const BANNED = new RegExp(['import', 'meta', 'env'].join('\\.'));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.(ts|mts|tsx|js|mjs|jsx|astro|mdx)$/.test(entry.name) || /\.test\.ts$/.test(entry.name)) {
      return [];
    }
    return [path];
  });
}

// All of src: nothing there needs the accessor, and a future server route
// outside src/pages/api would otherwise go unscanned.
const serverSources = sourceFiles(join(root, 'src')).map((path) => relative(root, path));

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const read = (path: string) => readFileSync(join(root, path), 'utf-8');

describe('the subscribe route reads its secret at runtime', () => {
  it('covers the route and the library', () => {
    expect(serverSources).toContain(join('src', 'pages', 'api', 'subscribe.ts'));
    expect(serverSources).toContain(join('src', 'lib', 'subscribe.ts'));
  });

  it.each(serverSources)('%s never contains the build-time accessor, in code or comments', (path) => {
    expect(read(path)).not.toMatch(BANNED);
  });

  it('reads the key through getSecret from astro:env/server, in code rather than comments', () => {
    const code = stripComments(read(join('src', 'pages', 'api', 'subscribe.ts')));
    expect(code).toMatch(/from ['"]astro:env\/server['"]/);
    expect(code).toMatch(/getSecret\(\s*['"]BUTTONDOWN_API_KEY['"]\s*\)/);
  });

  it('declares the key as a server secret in astro.config.mjs, whatever the key order', () => {
    expect(read('astro.config.mjs')).toMatch(
      /BUTTONDOWN_API_KEY:\s*envField\.string\(\{(?=[^}]*\bcontext:\s*['"]server['"])(?=[^}]*\baccess:\s*['"]secret['"])/,
    );
  });

  it('does not type the key onto the build-time accessor in src/env.d.ts', () => {
    expect(read(join('src', 'env.d.ts'))).not.toMatch(/BUTTONDOWN_API_KEY/);
  });
});
