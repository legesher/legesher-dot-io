// Where a language stands on the path of the "life of a language" page.
//
// The copy decides it: a pack status sits at the one stage whose tier it is
// (experimental, reviewed, official). The page and its script both read
// placement from here, so they cannot disagree, and a status that no stage
// carries stops the build instead of placing a language wrongly.

export type StepState = 'done' | 'here' | 'next' | 'later';

interface Tiered {
  readonly tier?: string;
}

/** The step, counted from 1, at which a language with this pack status stands. */
export function stepOfStatus(stages: readonly Tiered[], status: string): number {
  const steps = stages.flatMap((stage, i) => (stage.tier === status ? [i + 1] : []));
  if (steps.length !== 1) {
    throw new Error(`Pack status "${status}" must be the tier of exactly one stage; ${steps.length} carry it.`);
  }
  return steps[0];
}

/** Every pack status the stages carry, with its step. */
export function stepsOfStatuses(stages: readonly Tiered[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const stage of stages) {
    if (stage.tier) map[stage.tier] = stepOfStatus(stages, stage.tier);
  }
  return map;
}

/** How a step reads for a language standing at step `here`. */
export function stepState(step: number, here: number): StepState {
  if (step < here) return 'done';
  if (step === here) return 'here';
  return step === here + 1 ? 'next' : 'later';
}
