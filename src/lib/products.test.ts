import { describe, expect, it } from 'vitest';
import { PRODUCTS, installPathProblems, type Product } from './products';

// Parametrized from the real registry, never a frozen list, so a product added
// later is checked the moment it exists.
describe('PRODUCTS', () => {
  it('lists at least one live product', () => {
    expect(PRODUCTS.some((product) => product.status === 'live')).toBe(true);
  });

  it('has unique ids, since each becomes an anchor on the page', () => {
    const ids = PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PRODUCTS)('$id has an id usable as a URL fragment', ({ id }) => {
    expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(PRODUCTS)('$id breaks no install-path rule', (product) => {
    expect(installPathProblems(product)).toEqual([]);
  });
});

// The registry can hold no product in one of the two states (nothing is
// "Coming" once every product is live), and a rule checked only against the
// registry would then pass without running. Each entry below breaks one rule
// and must be named for it, whatever the registry holds.
const liveOpenSource: Product = {
  id: 'example-tool',
  name: 'Example tool',
  kind: 'open-source',
  summary: 'A tool written for this test.',
  status: 'live',
  access: { label: 'Open it on the registry', href: 'https://example.org/tool' },
  source: { label: 'Source', href: 'https://example.org/source' },
  commands: ['pip install example-tool'],
};

const liveAccount: Product = {
  id: 'example-service',
  name: 'Example service',
  kind: 'account',
  summary: 'A hosted service written for this test.',
  status: 'live',
  access: { label: 'Create your account', href: 'https://example.org/signup' },
  steps: ['Sign up', 'Get your key'],
  commands: ['curl https://example.org/v1/call'],
};

const coming: Product = {
  id: 'example-later',
  name: 'Example later',
  kind: 'account',
  summary: 'A product written for this test.',
  status: 'coming',
  arrives: 'Not yet open.',
};

describe('installPathProblems', () => {
  it.each([liveOpenSource, liveAccount, coming])('accepts a well-formed $status $kind entry', (product) => {
    expect(installPathProblems(product)).toEqual([]);
  });

  it.each<[string, Product, string]>([
    [
      'a command on a product that is not live',
      { ...coming, commands: ['pip install example-later'] },
      'advertises an install command while not live',
    ],
    [
      'an install link on a product that is not live',
      { ...coming, access: { label: 'Open it', href: 'https://example.org/later' } },
      'advertises an install link while not live',
    ],
    [
      'a further link on a product that is not live',
      { ...coming, alsoAt: [{ label: 'Open it elsewhere', href: 'https://example.org/elsewhere' }] },
      'advertises an install link while not live',
    ],
    [
      'a source link on a product that is not live',
      { ...coming, source: { label: 'Source', href: 'https://example.org/source' } },
      'advertises an install link while not live',
    ],
    [
      'steps on a product that is not live',
      { ...coming, steps: ['Sign up'] },
      'advertises install steps while not live',
    ],
    [
      'a product that is not live and does not say what it waits on',
      { ...coming, arrives: undefined },
      'does not say what it is waiting on',
    ],
    ['a live product with no install link', { ...liveOpenSource, access: undefined }, 'is live with no install link'],
    [
      'an install link that is not https',
      { ...liveOpenSource, access: { label: 'Open it', href: 'http://example.org/tool' } },
      'the install link is not an https link',
    ],
    [
      'a further link with no label',
      { ...liveOpenSource, alsoAt: [{ label: ' ', href: 'https://example.org/elsewhere' }] },
      'a further link has no label',
    ],
    [
      'a source link that is not https',
      { ...liveOpenSource, source: { label: 'Source', href: 'git://example.org/source' } },
      'the source link is not an https link',
    ],
    [
      'a live open-source product with no source link',
      { ...liveOpenSource, source: undefined },
      'is open source and live with no source link',
    ],
    [
      'a live account product with no steps',
      { ...liveAccount, steps: [] },
      'is reached through an account and live with no steps',
    ],
    [
      'a live account product with no first command',
      { ...liveAccount, commands: undefined },
      'is reached through an account and live with no first command',
    ],
    [
      'a live product that still says what it waits on',
      { ...liveOpenSource, arrives: 'Soon.' },
      'is live and still says what it is waiting on',
    ],
    [
      'a version typed into a command',
      { ...liveOpenSource, commands: ['pip install example-tool==1.2.3'] },
      'carries a hand-typed version string',
    ],
    [
      'a version typed into a label',
      { ...liveOpenSource, access: { label: 'Open v0.25 on the registry', href: 'https://example.org/tool' } },
      'carries a hand-typed version string',
    ],
    [
      'a version typed into a step',
      { ...liveAccount, steps: ['Sign up', 'Install 2.0'] },
      'carries a hand-typed version string',
    ],
  ])('names %s', (_, product, problem) => {
    expect(installPathProblems(product)).toContain(problem);
  });
});
