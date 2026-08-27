import { catalogSchema, type Catalog, type Chapter, type Lesson, type Scenario, type Track, type Unit } from '@/lib/content/schema';

import { PATHS } from './paths';
import { SCENARIOS } from './scenarios';
import { HTML_CSS_TRACK } from './tracks/html-css';
import { JAVASCRIPT_TRACK } from './tracks/javascript';
import { PYTHON_TRACK } from './tracks/python';

/**
 * The catalog is parsed once, at module load.
 *
 * Content is data, so the schema parse *is* the content test — a malformed lesson
 * fails the build rather than reaching a learner mid-chapter. `catalog.test.ts`
 * goes further and checks the things a schema cannot: that concept tags exist, that
 * beat anchors resolve, and that requirement ids are unique.
 */
export const CATALOG: Catalog = catalogSchema.parse({
  paths: PATHS,
  tracks: [HTML_CSS_TRACK, JAVASCRIPT_TRACK, PYTHON_TRACK],
  scenarios: SCENARIOS,
});

export const TRACKS = CATALOG.tracks;
export const LEARNING_PATHS = CATALOG.paths;
export const GROUND_SCENARIOS = CATALOG.scenarios;

const trackBySlug = new Map(TRACKS.map((track) => [track.slug, track]));
const trackById = new Map(TRACKS.map((track) => [track.id, track]));
const scenarioBySlug = new Map(GROUND_SCENARIOS.map((s) => [s.slug, s]));
const scenarioById = new Map(GROUND_SCENARIOS.map((s) => [s.id, s]));

export function getTrack(slug: string): Track | undefined {
  return trackBySlug.get(slug);
}

export function getTrackById(id: string): Track | undefined {
  return trackById.get(id);
}

export function getScenario(slug: string): Scenario | undefined {
  return scenarioBySlug.get(slug);
}

export function getScenarioById(id: string): Scenario | undefined {
  return scenarioById.get(id);
}

export interface LessonLocation {
  track: Track;
  unit: Unit;
  chapter: Chapter;
  lesson: Lesson;
}

export function findLesson(
  trackSlug: string,
  unitSlug: string,
  chapterSlug: string,
  lessonSlug: string,
): LessonLocation | undefined {
  const track = getTrack(trackSlug);
  const unit = track?.units.find((u) => u.slug === unitSlug);
  const chapter = unit?.chapters.find((c) => c.slug === chapterSlug);
  const lesson = chapter?.lessons.find((l) => l.slug === lessonSlug);
  if (!track || !unit || !chapter || !lesson) return undefined;
  return { track, unit, chapter, lesson };
}

export function findUnit(trackSlug: string, unitSlug: string): { track: Track; unit: Unit } | undefined {
  const track = getTrack(trackSlug);
  const unit = track?.units.find((u) => u.slug === unitSlug);
  if (!track || !unit) return undefined;
  return { track, unit };
}

/** Every lesson in a track, in curriculum order. Used for "what comes next". */
export function lessonsInTrack(track: Track): LessonLocation[] {
  const out: LessonLocation[] = [];
  for (const unit of track.units) {
    for (const chapter of unit.chapters) {
      for (const lesson of chapter.lessons) {
        out.push({ track, unit, chapter, lesson });
      }
    }
  }
  return out;
}

export function allLessons(): LessonLocation[] {
  return TRACKS.flatMap(lessonsInTrack);
}

/** Units are ordered, so a unit is open when the one before it has been graduated. */
export function previousUnit(track: Track, unit: Unit): Unit | undefined {
  const index = track.units.findIndex((u) => u.id === unit.id);
  return index > 0 ? track.units[index - 1] : undefined;
}

export function nextUnit(track: Track, unit: Unit): Unit | undefined {
  const index = track.units.findIndex((u) => u.id === unit.id);
  return index >= 0 ? track.units[index + 1] : undefined;
}

/** The next lesson after this one, staying inside the track. */
export function nextLesson(location: LessonLocation): LessonLocation | undefined {
  const ordered = lessonsInTrack(location.track);
  const index = ordered.findIndex((l) => l.lesson.id === location.lesson.id);
  return index >= 0 ? ordered[index + 1] : undefined;
}
