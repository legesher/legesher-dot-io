import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The PostHog loader is optional: Layout.astro renders it only when the build
// ran with PUBLIC_POSTHOG_KEY set, and astro.config.mjs widens the Content
// Security Policy to PostHog's origin only in that same case (CORE-1948). A
// build where one half is present without the other is the failure this guard
// exists for: a loader the policy blocks collects nothing and looks green,
// and a policy widened for a script that is not there is an open door for
// nothing. So on every built page the two must agree, and when the loader is
// there it sits in <body> after the page content like the Vercel components
// (layout-head.test.ts, built-head.test.ts). CI builds before it tests;
// locally the suite skips, by name, until `npm run build` has run.

const root = join(import.meta.dirname, '..', '..');
const output = join(root, '.vercel', 'output', 'static');

export const POSTHOG_ORIGIN = 'https://*.posthog.com';
export const LOADER_SRC = '/scripts/analytics.js';

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

function cspDirectives(html: string): Map<string, string[]> {
  const meta = html.match(/<meta[^>]+http-equiv=["']content-security-policy["'][^>]*>/i);
  expect(meta, 'carries a Content Security Policy meta').not.toBeNull();
  // The policy itself carries single-quoted keywords and hashes ('self',
  // 'sha256-...'), so the attribute is matched by its own quote character.
  const content = meta![0].match(/content=(["'])(.*?)\1/i);
  expect(content, 'the CSP meta has a content attribute').not.toBeNull();
  const policy = content![2];
  expect(policy, 'the policy names at least a default-src and a script-src').toMatch(/default-src[\s\S]*script-src/);
  return new Map(
    policy
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/);
        return [name, values] as const;
      }),
  );
}

const pages = existsSync(output) ? htmlFiles(output).map((path) => relative(output, path)) : [];
const suite = pages.length > 0 || process.env.CI ? describe : describe.skip;

suite('every built page loads PostHog only with a policy that allows it (needs npm run build)', () => {
  it('has build output to check', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)('%s', (page) => {
    const html = readFileSync(join(output, page), 'utf-8').replace(/<!--[\s\S]*?-->/g, '');
    const loaders = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)).filter(
      (m) => m[1] === LOADER_SRC,
    );
    const directives = cspDirectives(html);
    const scriptSrc = directives.get('script-src') ?? [];
    const connectSrc = directives.get('connect-src') ?? [];
    const allowed = scriptSrc.includes(POSTHOG_ORIGIN) && connectSrc.includes(POSTHOG_ORIGIN);
    const mentioned = [...scriptSrc, ...connectSrc].some((v) => v.includes('posthog'));

    if (loaders.length === 0) {
      expect(mentioned, 'no PostHog origin in the policy when the loader is absent').toBe(false);
      expect(html, 'no PostHog reference anywhere in the page').not.toMatch(/posthog/i);
      return;
    }

    expect(loaders, 'the loader appears once').toHaveLength(1);
    expect(allowed, `script-src and connect-src both allow ${POSTHOG_ORIGIN}`).toBe(true);
    expect(loaders[0][0], 'the loader carries the project key').toMatch(/\bdata-posthog-key=["'][^"']+["']/);

    const bodyOpen = html.search(/<body[\s>]/i);
    const loaderAt = html.indexOf(loaders[0][0]);
    const mainClose = html.lastIndexOf('</main>');
    expect(loaderAt, 'the loader is in <body>').toBeGreaterThan(bodyOpen);
    if (mainClose > -1) expect(loaderAt, 'the loader comes after the page content').toBeGreaterThan(mainClose);
  });
});
