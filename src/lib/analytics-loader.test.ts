import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The privacy page promises, in bold, that the site sets zero cookies and
// writes to no client-side storage, honours Do Not Track, and does not profile
// visitors. public/scripts/analytics.js is the only script that could break
// those promises, so its PostHog configuration is pinned here, option by
// option, against the page that makes them (CORE-1948). A change to either file
// has to come with a change to the other.

const root = join(import.meta.dirname, '..', '..');
const loader = readFileSync(join(root, 'public', 'scripts', 'analytics.js'), 'utf-8');
const privacy = readFileSync(join(root, 'src', 'pages', 'privacy.astro'), 'utf-8');

// Each promise the privacy page makes, the sentence that makes it, and the
// PostHog option that keeps it true.
const PROMISES = [
  { promise: 'zero cookies and no client-side storage', sentence: /zero cookies/i, option: /persistence:\s*'memory'/ },
  { promise: 'Do Not Track is honoured', sentence: /Do Not Track/, option: /respect_dnt:\s*true/ },
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
    expect(newsletter).toMatch(/\.identify\(/);
    expect(newsletter).not.toMatch(/posthog/i);
  });
});
