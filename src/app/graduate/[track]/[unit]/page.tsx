import { notFound } from 'next/navigation';

import { GraduationRunner } from '@/components/course/GraduationRunner';
import { findUnit, TRACKS } from '@/content';

export function generateStaticParams() {
  return TRACKS.flatMap((track) =>
    track.units
      .filter((unit) => unit.graduation !== null)
      .map((unit) => ({ track: track.slug, unit: unit.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string; unit: string }>;
}) {
  const { track, unit } = await params;
  const found = findUnit(track, unit);
  return { title: found?.unit.graduation?.title ?? 'Build' };
}

export default async function GraduatePage({
  params,
}: {
  params: Promise<{ track: string; unit: string }>;
}) {
  const { track, unit } = await params;
  const found = findUnit(track, unit);
  if (!found || !found.unit.graduation) notFound();

  return (
    <main id="main">
      <GraduationRunner track={found.track} unit={found.unit} />
    </main>
  );
}
