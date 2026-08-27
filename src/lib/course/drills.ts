import { allLessons } from '@/content';
import { planBeats } from '@/lib/content/beats';

/**
 * Warm-up drills, derived from authored lesson beats.
 *
 * Nothing here is written twice: a drill is a beat the learner has already met —
 * its note as the prompt, the lines it typed as the target — re-presented with the
 * same ghost mechanic. That keeps revision in the learner's own words from the
 * lesson they saw it in, and means the warm-up library grows automatically as
 * content is authored.
 */

export interface Drill {
  id: string;
  conceptIds: string[];
  /** The note the beat carried when it was first taught. */
  prompt: string;
  target: string;
  file: string;
  lessonTitle: string;
  chapterTitle: string;
  /** Typed to the lesson route shape so `typedRoutes` accepts it in a Link. */
  href: `/learn/${string}/${string}/${string}/${string}`;
}

/** Long enough to be worth typing, short enough to stay a warm-up. */
const MIN_CHARS = 12;
const MAX_CHARS = 260;

let cache: Drill[] | null = null;

export function allDrills(): Drill[] {
  if (cache) return cache;

  const drills: Drill[] = [];

  for (const location of allLessons()) {
    const { track, unit, chapter, lesson } = location;

    for (const step of lesson.steps) {
      if (step.kind !== 'demo') continue;

      const plan = planBeats(lesson.startFiles, step.beats);

      plan.beats.forEach((beat) => {
        if (beat.concepts.length === 0) return;

        // One drill per beat, per file it touched, so a drill is a single coherent
        // snippet rather than a jump between two documents.
        const byFile = new Map<string, string>();
        for (const edit of beat.edits) {
          byFile.set(edit.file, (byFile.get(edit.file) ?? '') + edit.text);
        }

        for (const [file, text] of byFile) {
          const target = text.replace(/^\n+|\n+$/g, '');
          if (target.length < MIN_CHARS || target.length > MAX_CHARS) continue;

          drills.push({
            id: `${lesson.id}:${beat.id}:${file}`,
            conceptIds: beat.concepts,
            prompt: beat.note,
            target,
            file,
            lessonTitle: lesson.title,
            chapterTitle: chapter.title,
            href: `/learn/${track.slug}/${unit.slug}/${chapter.slug}/${lesson.slug}`,
          });
        }
      });
    }
  }

  cache = drills;
  return drills;
}

/** Every drill that would exercise a given concept. */
export function drillsForConcept(conceptId: string): Drill[] {
  return allDrills().filter((drill) => drill.conceptIds.includes(conceptId));
}

/**
 * Builds a session from what the learner is closest to forgetting.
 *
 * One drill per concept, weakest first, and never the same drill twice in a
 * session — repeating one snippet three times is typing practice, not revision.
 */
export function buildWarmupSession(
  dueConceptIds: readonly string[],
  limit = 6,
): Drill[] {
  const chosen: Drill[] = [];
  const used = new Set<string>();

  for (const conceptId of dueConceptIds) {
    if (chosen.length >= limit) break;
    const candidate = drillsForConcept(conceptId).find((drill) => !used.has(drill.id));
    if (!candidate) continue;
    used.add(candidate.id);
    chosen.push(candidate);
  }

  return chosen;
}
