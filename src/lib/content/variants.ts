import type { Check, Requirement } from './checks';
import type { Prose, Scenario, Variant } from './schema';

const TOKEN = /\{\{\s*([\w.-]+)\s*\}\}/g;

/** Substitutes `{{token}}` against a variant's values. Unknown tokens are left alone. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(TOKEN, (whole, key: string) => values[key] ?? whole);
}

export function fillProse(blocks: readonly Prose[], values: Record<string, string>): Prose[] {
  return blocks.map((block) => {
    switch (block.kind) {
      case 'p':
      case 'heading':
      case 'note':
        return { ...block, text: fill(block.text, values) };
      case 'list':
        return { ...block, items: block.items.map((item) => fill(item, values)) };
      case 'code':
        return { ...block, code: fill(block.code, values) };
    }
  });
}

function fillCheck(check: Check, values: Record<string, string>): Check {
  const filled = { ...check } as Record<string, unknown>;
  for (const [key, value] of Object.entries(filled)) {
    if (typeof value === 'string' && key !== 'kind') filled[key] = fill(value, values);
  }
  return filled as Check;
}

/**
 * Requirements are authored once and shared by every variant. Filling them in
 * substitutes the client's details without touching the structure, so two learners
 * on different variants are held to exactly the same standard — which is what makes
 * an unbounded-feeling library affordable without diluting it.
 */
export function fillRequirements(
  requirements: readonly Requirement[],
  values: Record<string, string>,
): Requirement[] {
  return requirements.map((requirement) => ({
    ...requirement,
    label: fill(requirement.label, values),
    checks: requirement.checks.map((check) => fillCheck(check, values)),
  }));
}

export interface ResolvedScenario {
  scenario: Scenario;
  variant: Variant;
  brief: Prose[];
  requirements: Requirement[];
  starterFiles: Record<string, string>;
}

export function resolveScenario(scenario: Scenario, variant: Variant): ResolvedScenario {
  const starterFiles: Record<string, string> = {};
  for (const [path, contents] of Object.entries(scenario.starterFiles)) {
    starterFiles[path] = fill(contents, variant.values);
  }
  return {
    scenario,
    variant,
    brief: fillProse(scenario.brief, variant.values),
    requirements: fillRequirements(scenario.requirements, variant.values),
    starterFiles,
  };
}

/**
 * Picks a variant deterministically from a stable key, so a learner who reloads
 * gets the same client rather than a fresh brief mid-build.
 */
export function pickVariant(scenario: Scenario, key: string): Variant {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % scenario.variants.length;
  return scenario.variants[index] ?? scenario.variants[0]!;
}
