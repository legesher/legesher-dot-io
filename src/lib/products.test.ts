import { describe, expect, it } from 'vitest';
import { PRODUCTS } from './products';

// Parametrized from the real registry, never a frozen list, so a product added
// later is checked the moment it exists.
const live = PRODUCTS.filter((product) => product.status === 'live');
const coming = PRODUCTS.filter((product) => product.status === 'coming');

describe('PRODUCTS', () => {
  it('lists at least one product in each state, so neither guard below is vacuous', () => {
    expect(live.length).toBeGreaterThan(0);
    expect(coming.length).toBeGreaterThan(0);
  });

  it('has unique ids, since each becomes an anchor on the page', () => {
    const ids = PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PRODUCTS)('$id has an id usable as a URL fragment', ({ id }) => {
    expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe('a product that is not live', () => {
  it.each(coming)('$id advertises no install command', ({ commands }) => {
    expect(commands).toBeUndefined();
  });

  it.each(coming)('$id advertises no install link', ({ access }) => {
    expect(access).toBeUndefined();
  });

  it.each(coming)('$id says what it is waiting on', ({ arrives }) => {
    expect(arrives).toBeTruthy();
  });
});

describe('a live product', () => {
  it.each(live)('$id links to where it lives, over https', ({ access }) => {
    expect(access).toBeDefined();
    expect(access?.href).toMatch(/^https:\/\//);
    expect(access?.label).toBeTruthy();
  });

  it.each(live)('$id carries no hand-typed version string', ({ summary, stage, access }) => {
    const text = [summary, stage ?? '', access?.label ?? ''].join(' ');
    expect(text).not.toMatch(/\bv?\d+\.\d+(\.\d+)?\b/);
  });
});
