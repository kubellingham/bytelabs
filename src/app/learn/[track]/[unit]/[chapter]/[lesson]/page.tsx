import { notFound } from 'next/navigation';

import { LessonPlayer } from '@/components/course/LessonPlayer';
import { allLessons, findLesson } from '@/content';

interface Params {
  track: string;
  unit: string;
  chapter: string;
  lesson: string;
}

/** Every authored lesson is known at build time, so all of them prerender. */
export function generateStaticParams(): Params[] {
  return allLessons().map(({ track, unit, chapter, lesson }) => ({
    track: track.slug,
    unit: unit.slug,
    chapter: chapter.slug,
    lesson: lesson.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { track, unit, chapter, lesson } = await params;
  const location = findLesson(track, unit, chapter, lesson);
  return { title: location ? location.lesson.title : 'Lesson' };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { track, unit, chapter, lesson } = await params;
  const location = findLesson(track, unit, chapter, lesson);
  if (!location) notFound();

  return (
    <main id="main">
      <LessonPlayer location={location} />
    </main>
  );
}
