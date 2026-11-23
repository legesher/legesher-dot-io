import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// The privacy page promises, in bold, that the site sets zero cookies and
// writes to no client-side storage, honours Do Not Track, and does not profile
// visitors. public/scripts/analytics.js is the only script that could break
// those promises, so its PostHog configuration is pinned here, option by
// option, against the page that makes them (CORE-1948). A change to either file
// has to come with a change to the other.

const root = join(import.meta.dirname, '..', '..');
const loader = readFileSync(join(root, 'public', 'scripts', 'analytics.js'), 'utf-8');
const privacy = readFileSync(join(root, 'src', 'content', 'legal', 'privacy.mdx'), 'utf-8');

// Each promise the privacy page makes, the sentence that makes it, and the
// PostHog option that keeps it true.
const PROMISES = [
  { promise: 'zero cookies and no client-side storage', sentence: /zero cookies/i, option: /persistence:\s*'memory'/ },
  { promise: 'Do Not Track is honoured', sentence: /Do Not Track/, option: /respect_dnt:\s*true/ },
  { promise: 'Global Privacy Control is honoured', sentence: /Global Privacy Control/, option: /nav\.globalPrivacyControl === true/ },
  { promise: 'no session reconstruction', sentence: /reconstruct a browsing session/i, option: /disable_session_recording:\s*true/ },
  { promise: 'no behavioural profiling', sentence: /behavioural profiling/i, option: /autocapture:\s*false/ },
] as const;

// Options the funnel needs set regardless of what the privacy page says.
const FIXED_OPTIONS = [
  /capture_pageview:\s*false/,
  /capture_pageleave:\s*false/,
  /disable_surveys:\s*true/,
  /person_profiles:\s*'identified_only'/,
  /api_host:\s*'https:\/\/us\.i\.posthog\.com'/,
  // No feature flags: no /flags request carrying the distinct id.
  /advanced_disable_flags:\s*true/,
  // Omit, never default: PostHog's own campaign and referrer collection would
  // add null-valued utm and click-id keys and first-touch person properties.
  /save_campaign_params:\s*false/,
  /save_referrer:\s*false/,
  /before_send:[\s\S]*?\$identify[\s\S]*?delete event\.\$set_once/,
] as const;

// Five events answer the funnel; fifty answer nothing (CORE-1948).
export const EVENTS = [
  'newsletter_cta_viewed',
  'newsletter_cta_clicked',
  'newsletter_completed',
  'corpus_link_clicked',
  'docs_visited',
] as const;

describe('public/scripts/analytics.js keeps the privacy page true', () => {
  it.each(PROMISES)('$promise', ({ sentence, option }) => {
    expect(privacy, 'the privacy page still makes this promise').toMatch(sentence);
    expect(loader, 'the loader keeps it').toMatch(option);
  });

  it.each(FIXED_OPTIONS.map((o) => [o.source, o] as const))('sets %s', (_name, option) => {
    expect(loader).toMatch(option);
  });

  it('offers no way to name a visitor', () => {
    expect(loader).not.toMatch(/identify\(|['"]identify['"]|alias|\$set\b|people\./);
    expect(privacy).toMatch(/Subscribing does not link these interactions to your email address/);
  });

  it('does nothing without a project key', () => {
    expect(loader).toMatch(/dataset\.posthogKey/);
    expect(loader).toMatch(/if\s*\(!key\)\s*return/);
  });
});

describe('the event schema is the five funnel events and no more', () => {
  const declared = Array.from(loader.matchAll(/^\s*([a-z_]+):\s*'([a-z_]+)',?\s*$/gm), (m) => m[2]).filter((v) =>
    /_(viewed|clicked|completed|visited)$/.test(v),
  );

  it('declares exactly the five events', () => {
    expect(new Set(declared)).toEqual(new Set(EVENTS));
    expect(declared).toHaveLength(EVENTS.length);
  });

  it.each(EVENTS)('%s is declared once', (event) => {
    expect(declared.filter((d) => d === event)).toHaveLength(1);
  });

  it('the newsletter script reports completion through the shared capture, not PostHog directly', () => {
    // Comments are stripped first: a note that names the vendor is not a call.
    const newsletter = readFileSync(join(root, 'public', 'scripts', 'newsletter.js'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(newsletter).toMatch(/legesherAnalytics/);
    expect(newsletter).toMatch(/events\.completed/);
    // Subscribing never names the visitor: no identify call, so PostHog never
    // holds an email address (decided 14 Nov 2026; the privacy page says so).
    expect(newsletter).not.toMatch(/\.identify\(/);
    expect(newsletter).not.toMatch(/posthog/i);
    // Nothing that names the subscriber travels with the completion event.
    const captures = Array.from(newsletter.matchAll(/\.capture\(([\s\S]*?)\);/g), (m) => m[1]);
    expect(captures.length).toBeGreaterThan(0);
    expect(captures.filter((args) => /email|name/i.test(args)), 'capture arguments carry no email or name').toEqual([]);
  });
});

// The loader run for real, against a stand-in page and a stand-in PostHog:
// Do Not Track and Global Privacy Control stop it before any request, and
// nothing that passes through it reaches PostHog as anything but a capture
// carrying no address.
type Recorded = { method: string; args: unknown[] };

function runLoader(navigator: Record<string, unknown>, windowExtra: Record<string, unknown> = {}) {
  const created: { tag: string; src?: string; listeners: Record<string, () => void> }[] = [];
  const document = {
    currentScript: { dataset: { posthogKey: 'phc_TEST' } },
    createElement(tag: string) {
      const element = {
        tag,
        listeners: {} as Record<string, () => void>,
        addEventListener(event: string, fn: () => void) {
          element.listeners[event] = fn;
        },
      };
      created.push(element);
      return element;
    },
    head: { appendChild() {} },
    getElementById: () => null,
    addEventListener() {},
  };
  const window: Record<string, unknown> = { navigator, ...windowExtra };
  runInNewContext(loader, { window, document });
  return { window, created };
}

const LOADER_SIGNALS = [
  { signal: 'Global Privacy Control', navigator: { globalPrivacyControl: true } },
  { signal: 'Do Not Track', navigator: { doNotTrack: '1' } },
  { signal: 'Do Not Track (older spelling)', navigator: { doNotTrack: 'yes' } },
  { signal: 'Do Not Track (msDoNotTrack)', navigator: { msDoNotTrack: '1' } },
  { signal: 'Do Not Track (window.doNotTrack)', navigator: {}, window: { doNotTrack: '1' } },
] as const;

describe('public/scripts/analytics.js, run', () => {
  it.each(LOADER_SIGNALS)('$signal: no PostHog script is requested', ({ navigator, ...rest }) => {
    const { window, created } = runLoader({ ...navigator }, 'window' in rest ? rest.window : {});
    expect(created, 'no script element is created').toEqual([]);
    expect(window.legesherAnalytics, 'no capture is offered').toBeUndefined();
  });

  it('no signal: one PostHog script, and captures reach PostHog with no address', () => {
    const { window, created } = runLoader({ doNotTrack: '0', globalPrivacyControl: false });
    expect(created.map((c) => c.tag)).toEqual(['script']);

    const calls: Recorded[] = [];
    const instance = new Proxy(
      {},
      { get: (_t, method: string) => (...args: unknown[]) => void calls.push({ method, args }) },
    );
    window.posthog = {
      init(_key: string, options: { loaded: (i: unknown) => void }) {
        options.loaded(instance);
      },
    };
    created[0].listeners.load();

    const analytics = window.legesherAnalytics as { capture: (e: string, p?: object) => void };
    expect(Object.keys(analytics).sort()).toEqual(['capture', 'events']);
    analytics.capture('newsletter_completed', { utm_source: 'probe', utm_campaign: 'probe' });

    expect(calls.map((c) => c.method)).toEqual(['capture']);
    expect(JSON.stringify(calls), 'no address in anything sent').not.toMatch(/@/);
  });
});
