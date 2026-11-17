import { describe, expect, it } from 'vitest';
import registry from '../language-registry.json';
import { en } from './copy';
import { stepOfStatus, stepsOfStatuses, stepState } from './path';

// Where a language stands on the path comes from the copy: a pack status sits
// at the one step whose tier it is. Parametrized from the registry, so a status
// the registry starts using that no step carries fails here, by name.

const statuses = [...new Set(registry.languages.map((l) => l.status))];

describe('every pack status in the registry has a place on the path', () => {
  it.each(statuses)('%s sits at the step whose tier it is', (status) => {
    const step = stepOfStatus(en.stages, status);
    expect(en.stages[step - 1].tier).toBe(status);
  });
});

describe('stepOfStatus', () => {
  it('refuses a status no step carries, such as the retired in_review', () => {
    expect(() => stepOfStatus(en.stages, 'in_review')).toThrow(/in_review/);
  });

  it('refuses a status two steps carry', () => {
    const doubled = [{ tier: 'reviewed' }, { tier: 'reviewed' }] as const;
    expect(() => stepOfStatus(doubled, 'reviewed')).toThrow(/exactly one/);
  });
});

describe('stepsOfStatuses', () => {
  it('maps each tier the copy names to its step', () => {
    const map = stepsOfStatuses(en.stages);
    expect(Object.keys(map).sort()).toEqual(Object.keys(en.tiers).sort());
    for (const [status, step] of Object.entries(map)) {
      expect(en.stages[step - 1].tier).toBe(status);
    }
  });
});

describe('stepState', () => {
  it('reads done before the language, here at it, next after it, later beyond', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => stepState(n, 4))).toEqual([
      'done',
      'done',
      'done',
      'here',
      'next',
      'later',
      'later',
      'later',
    ]);
  });

  it('has no next step after the last', () => {
    expect([7, 8].map((n) => stepState(n, 8))).toEqual(['done', 'here']);
  });
});
