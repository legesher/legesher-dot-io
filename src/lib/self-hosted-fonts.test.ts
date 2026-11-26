// www.legesher.io sends visitors' data to no font service: the fonts are
// served from the site itself (the @fontsource-variable packages, imported in src/styles/globals.css).
// This keeps any page, stylesheet or the Content Security Policy from reaching
// Google Fonts again. The source check runs without a build; the built check
// reads every built HTML and CSS file once `npm run build` has run.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..');
const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/;

function files(dir: string, keep: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path, keep);
    return keep(name) ? [path] : [];
  });
}

const TEXT = /\.(astro|css|mjs|js|ts|tsx|mdx|md|html|json)$/;
const sources = [
  ...files(join(root, 'src'), (name) => TEXT.test(name) && !name.endsWith('.test.ts')),
  ...files(join(root, 'public'), (name) => TEXT.test(name)),
  join(root, 'astro.config.mjs'),
  join(root, 'tailwind.config.ts'),
];
const output = join(root, '.vercel', 'output', 'static');
const built = files(output, (name) => /\.(html|css)$/.test(name));

describe('fonts are served from the site, not Google Fonts', () => {
  it('finds the source files and the font import', () => {
    expect(sources.length).toBeGreaterThan(10);
    expect(readFileSync(join(root, 'src', 'styles', 'globals.css'), 'utf-8')).toMatch(/@fontsource-variable\/noto-sans/);
  });

  it.each(sources.map((path) => [relative(root, path), path]))('%s names no Google Fonts address', (_name, path) => {
    expect(readFileSync(path, 'utf-8')).not.toMatch(GOOGLE_FONTS);
  });

  (built.length > 0 || process.env.CI ? it : it.skip)('no built page or stylesheet names a Google Fonts address (needs npm run build)', () => {
    const offending = built.filter((path) => GOOGLE_FONTS.test(readFileSync(path, 'utf-8'))).map((path) => relative(output, path));
    expect(built.length, 'the build has pages and stylesheets').toBeGreaterThan(0);
    expect(offending).toEqual([]);
  });
});
