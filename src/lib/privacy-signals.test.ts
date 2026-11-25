import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// The Cookie Policy says that when your browser sends Do Not Track or Global
// Privacy Control, our analytics send nothing. Vercel Web Analytics and Speed
// Insights check neither signal on their own, so public/scripts/privacy-signals.js
// gives each a beforeSend that drops every event while a signal is present.
// This runs the script against each signal and checks that the layout renders
// it before both Vercel components, which read the hooks when they start.

const root = join(import.meta.dirname, '..', '..');
const script = readFileSync(join(root, 'public', 'scripts', 'privacy-signals.js'), 'utf-8');
const layout = readFileSync(join(root, 'src', 'layouts', 'Layout.astro'), 'utf-8');
const cookies = readFileSync(join(root, 'src', 'content', 'legal', 'cookies.mdx'), 'utf-8');

const HOOKS = ['webAnalyticsBeforeSend', 'speedInsightsBeforeSend'] as const;

type Hook = (event: unknown) => unknown;

function hooksFor(navigator: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const window: Record<string, unknown> = { navigator, ...extra };
  runInNewContext(script, { window });
  return HOOKS.map((name) => [name, window[name] as Hook] as const);
}

const SIGNALS = [
  { signal: 'Global Privacy Control', navigator: { globalPrivacyControl: true } },
  { signal: 'Do Not Track', navigator: { doNotTrack: '1' } },
  { signal: 'Do Not Track (older spelling)', navigator: { doNotTrack: 'yes' } },
  { signal: 'Do Not Track (msDoNotTrack)', navigator: { msDoNotTrack: '1' } },
  { signal: 'Do Not Track (window.doNotTrack)', navigator: {}, window: { doNotTrack: '1' } },
] as const;

describe('public/scripts/privacy-signals.js', () => {
  const event = { type: 'pageview', url: 'https://www.legesher.io/' };

  it.each(SIGNALS)('$signal: every Vercel event is dropped', ({ navigator, ...rest }) => {
    const extra = 'window' in rest ? rest.window : {};
    for (const [name, hook] of hooksFor({ ...navigator }, extra)) {
      expect(typeof hook, `${name} is set`).toBe('function');
      expect(hook(event), `${name} drops the event`).toBeNull();
    }
  });

  it('no signal: every Vercel event passes unchanged', () => {
    for (const [name, hook] of hooksFor({ doNotTrack: '0', globalPrivacyControl: false })) {
      expect(hook(event), `${name} passes the event`).toBe(event);
    }
  });
});

describe('Layout.astro renders the signal script before the Vercel components', () => {
  const body = layout.slice(layout.search(/<body[\s>]/), layout.indexOf('</body>'));
  const at = body.indexOf('<script src="/scripts/privacy-signals.js" is:inline></script>');

  it('renders the script in <body>', () => {
    expect(at).toBeGreaterThan(-1);
  });

  it.each(['<SpeedInsights', '<Analytics'])('%s comes after it', (component) => {
    expect(body.indexOf(component)).toBeGreaterThan(at);
  });
});

describe('the Cookie Policy makes the promise this keeps', () => {
  it('names both signals in one sentence', () => {
    expect(cookies).toMatch(/When your browser sends Do Not Track or Global Privacy Control, our analytics records nothing/);
  });
});
