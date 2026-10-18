import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The subscribe route must read BUTTONDOWN_API_KEY at request time. Astro
// replaces `import.meta.env.<KEY>` with a literal during the build, which
// either bakes the secret into the deployed function or, when the variable is
// absent at build time, ships an endpoint that fails every request. Declaring
// the key as a server secret in astro.config.mjs and reading it through
// astro:env keeps the lookup at runtime (CORE-2193).

const root = join(import.meta.dirname, '..', '..');
const route = readFileSync(join(root, 'src', 'pages', 'api', 'subscribe.ts'), 'utf-8');
const config = readFileSync(join(root, 'astro.config.mjs'), 'utf-8');

describe('the subscribe route reads its secret at runtime', () => {
  it('does not read BUTTONDOWN_API_KEY through import.meta.env', () => {
    expect(route).not.toMatch(/import\.meta\.env\.BUTTONDOWN_API_KEY/);
    expect(route).not.toMatch(/import\.meta\.env\[/);
  });

  it('reads the key through getSecret from astro:env/server', () => {
    expect(route).toMatch(/from ['"]astro:env\/server['"]/);
    expect(route).toMatch(/getSecret\(['"]BUTTONDOWN_API_KEY['"]\)/);
  });

  it('declares the key as a server secret in astro.config.mjs', () => {
    expect(config).toMatch(
      /BUTTONDOWN_API_KEY:\s*envField\.string\(\{[^}]*context:\s*['"]server['"][^}]*access:\s*['"]secret['"]/s,
    );
  });
});
