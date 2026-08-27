import { describe, expect, it } from 'vitest';

import { CONCEPTS, isKnownConcept, SKILLS } from '@/content/concepts';
import { allLessons, CATALOG, GROUND_SCENARIOS, TRACKS } from '@/content';
import { planBeats } from '@/lib/content/beats';
import { fillRequirements, resolveScenario } from '@/lib/content/variants';

/**
 * Content is data, so these are the tests that matter most. A malformed lesson
 * should fail CI, not surface to a learner halfway through a chapter.
 */

describe('catalog', () => {
  it('parses every track, path and scenario against the schema', () => {
    // CATALOG is parsed at module load; reaching here at all means it validated.
    expect(CATALOG.tracks.length).toBeGreaterThan(0);
    expect(CATALOG.paths.length).toBeGreaterThan(0);
    expect(CATALOG.scenarios.length).toBeGreaterThan(0);
  });

  it('has globally unique ids', () => {
    const ids: string[] = [];
    for (const track of TRACKS) {
      ids.push(track.id);
      for (const unit of track.units) {
        ids.push(unit.id);
        for (const chapter of unit.chapters) {
          ids.push(chapter.id);
          for (const lesson of chapter.lessons) {
            ids.push(lesson.id);
            for (const step of lesson.steps) ids.push(step.id);
          }
        }
      }
    }
    for (const scenario of GROUND_SCENARIOS) ids.push(scenario.id);

    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  it('references only concepts that exist in the registry', () => {
    const unknown = new Set<string>();
    const check = (concepts: readonly string[]) => {
      for (const concept of concepts) if (!isKnownConcept(concept)) unknown.add(concept);
    };

    for (const { lesson } of allLessons()) {
      check(lesson.concepts);
      for (const step of lesson.steps) {
        if (step.kind === 'explain' || step.kind === 'practice') check(step.concepts);
        if (step.kind === 'demo') for (const beat of step.beats) check(beat.concepts);
        if (step.kind === 'check') for (const r of step.requirements) check(r.concepts);
      }
    }

    for (const track of TRACKS) {
      for (const unit of track.units) {
        if (!unit.graduation) continue;
        for (const requirement of unit.graduation.requirements) check(requirement.concepts);
      }
    }

    for (const scenario of GROUND_SCENARIOS) {
      check(scenario.concepts);
      for (const requirement of scenario.requirements) check(requirement.concepts);
    }

    expect([...unknown]).toEqual([]);
  });

  it('tags every concept against a skill that exists', () => {
    const skillIds = new Set(SKILLS.map((skill) => skill.id));
    const orphans = CONCEPTS.filter((concept) => !skillIds.has(concept.skillId));
    expect(orphans.map((c) => c.id)).toEqual([]);
  });
});

describe('lesson beats', () => {
  it('resolves every anchor in every authored demo', () => {
    for (const { lesson, chapter } of allLessons()) {
      for (const step of lesson.steps) {
        if (step.kind !== 'demo') continue;
        expect(
          () => planBeats(lesson.startFiles, step.beats),
          `${chapter.slug}/${lesson.slug}/${step.id}`,
        ).not.toThrow();
      }
    }
  });

  it('produces a demo result that differs from where it started', () => {
    for (const { lesson } of allLessons()) {
      for (const step of lesson.steps) {
        if (step.kind !== 'demo') continue;
        const plan = planBeats(lesson.startFiles, step.beats);
        expect(plan.result, `${lesson.slug}/${step.id}`).not.toEqual(lesson.startFiles);
      }
    }
  });

  it('only practises files the demo actually produced', () => {
    for (const { lesson } of allLessons()) {
      const produced = new Set(Object.keys(lesson.startFiles));
      for (const step of lesson.steps) {
        if (step.kind === 'demo') {
          for (const file of Object.keys(planBeats(lesson.startFiles, step.beats).result)) {
            produced.add(file);
          }
        }
        if (step.kind === 'practice') {
          for (const file of step.files) {
            expect(produced.has(file), `${lesson.slug} practises unknown file ${file}`).toBe(true);
          }
        }
      }
    }
  });
});

describe('requirements', () => {
  it('has unique requirement ids within each scenario and graduation', () => {
    const assertUnique = (ids: string[], label: string) => {
      expect(new Set(ids).size, label).toBe(ids.length);
    };

    for (const scenario of GROUND_SCENARIOS) {
      assertUnique(scenario.requirements.map((r) => r.id), scenario.id);
    }
    for (const track of TRACKS) {
      for (const unit of track.units) {
        if (!unit.graduation) continue;
        assertUnique(unit.graduation.requirements.map((r) => r.id), unit.graduation.id);
      }
    }
  });

  it('leaves no unresolved placeholder once a variant is applied', () => {
    for (const scenario of GROUND_SCENARIOS) {
      for (const variant of scenario.variants) {
        const resolved = resolveScenario(scenario, variant);
        const serialised = JSON.stringify({
          brief: resolved.brief,
          requirements: resolved.requirements,
          files: resolved.starterFiles,
        });
        expect(serialised, `${scenario.id}/${variant.id}`).not.toMatch(/\{\{/);
      }
    }
  });

  it('holds every variant to an identical requirement structure', () => {
    for (const scenario of GROUND_SCENARIOS) {
      const shape = (values: Record<string, string>) =>
        fillRequirements(scenario.requirements, values).map((r) => ({
          id: r.id,
          mode: r.mode,
          checkKinds: r.checks.map((c) => c.kind),
        }));

      const first = shape(scenario.variants[0]!.values);
      for (const variant of scenario.variants.slice(1)) {
        // The client changes; the standard does not. This is the whole premise of
        // parameterised scenarios, so it is asserted rather than assumed.
        expect(shape(variant.values), `${scenario.id}/${variant.id}`).toEqual(first);
      }
    }
  });
});
