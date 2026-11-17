import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import registry from './language-registry.json';
import packSampleData from './pack-samples.json';
import { en } from './life-of-a-language/copy';
import { stepOfStatus, stepState } from './life-of-a-language/path';

// What the build made of /life-of-a-language, read from the built HTML: the
// page a visitor gets before any script runs. Every expected value comes from
// the registry, the pack samples or the copy.
//
// CI builds before it tests; locally the suite skips, by name, until
// `npm run build` has run.

const root = join(import.meta.dirname, '..', '..');
const page = join(root, '.vercel', 'output', 'static', 'life-of-a-language', 'index.html');
const built = existsSync(page);
const suite = built || process.env.CI ? describe : describe.skip;
const html = built ? readFileSync(page, 'utf-8') : '';

// The language the page shows before any script runs, as the build wrote it.
const defaultCode = html.match(/\sdata-default="([^"]+)"/)?.[1] ?? '';
const followed = registry.languages.find((l) => l.code === defaultCode);
const sample = packSampleData.samples.find((s) => s.code === defaultCode);
const here = followed ? stepOfStatus(en.stages, followed.status) : 0;

/** The opening tag of each step, in page order. */
const stepTags = [...html.matchAll(/<li\b[^>]*class="[^"]*\blol-stage\b[^"]*"[^>]*>/g)].map((m) => m[0]);
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

suite('the built life of a language page (needs npm run build)', () => {
  it('exists', () => {
    expect(built).toBe(true);
  });

  it('shows a default language that the registry lists and the pack samples carry', () => {
    expect(followed, `data-default="${defaultCode}"`).toBeDefined();
    expect(sample, `pack sample for ${defaultCode}`).toBeDefined();
  });

  it('leaves no placeholder unfilled', () => {
    expect(html).not.toContain('{lang}');
  });

  it('gives the number of languages with a pack from the registry', () => {
    expect(html).toContain(en.panels.experimental.packs(registry.languages.length));
  });

  it('shows the eight steps in the order of the copy', () => {
    expect(stepTags.map((tag) => attr(tag, 'id'))).toEqual(en.stages.map((s) => s.id));
  });

  it('places the default language at the step of its pack status', () => {
    expect(stepTags.map((tag) => attr(tag, 'data-state'))).toEqual(
      en.stages.map((_, i) => stepState(i + 1, here)),
    );
  });

  it('names the default language in its own script', () => {
    expect(html).toContain(`<bdi data-l="native" lang="${followed?.tag}"`);
    expect(html).toContain(`>${sample?.name}</bdi>`);
  });

  it('links to the default language’s review file by its tag', () => {
    expect(html).toContain(`/reference/${followed?.tag}.md"`);
  });

  it('offers every registry language except the canonical one in the picker, once each', () => {
    const select = html.match(/<select\b[^>]*id="lol-picker"[\s\S]*?<\/select>/)?.[0] ?? '';
    const values = [...select.matchAll(/<option\b[^>]*value="([^"]+)"/g)].map((m) => m[1]);
    const expected = registry.languages.map((l) => l.code).filter((c) => c !== registry.canonical);
    expect(values.sort()).toEqual(expected.sort());
  });

  it('works without a script: the picker and its label are hidden, every step is open, no toggle shows', () => {
    const wrap = html.match(/<div\b[^>]*data-lol-picker-wrap[^>]*>/)?.[0] ?? '';
    expect(wrap).toMatch(/\shidden(\s|>|=)/);
    const block = html.match(/<div\b[^>]*data-lol-picker-wrap[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(block, 'the label sits inside the hidden wrapper').toContain('<label for="lol-picker"');
    const bodies = [...html.matchAll(/<div\b[^>]*data-lol-body[^>]*>/g)].map((m) => m[0]);
    expect(bodies).toHaveLength(en.stages.length);
    for (const body of bodies) expect(body).not.toMatch(/\shidden(\s|>|=)/);
    const toggles = [...html.matchAll(/<button\b[^>]*data-lol-toggle[^>]*>/g)].map((m) => m[0]);
    expect(toggles).toHaveLength(en.stages.length);
    for (const toggle of toggles) expect(toggle).toMatch(/\shidden(\s|>|=)/);
  });

  it('carries no inline style attribute, which the Content Security Policy would refuse', () => {
    expect(html).not.toMatch(/<[^>]+\sstyle="/);
  });
});
