import { notFound } from 'next/navigation';
import { Page } from '@/components/shell/Page';

import { UnitMap } from '@/components/course/UnitMap';
import { getTrack, TRACKS } from '@/content';

export function generateStaticParams() {
  return TRACKS.map((track) => ({ track: track.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const track = getTrack((await params).track);
  return { title: track ? track.title : 'Track' };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const track = getTrack((await params).track);
  if (!track) notFound();

  const authored = track.units.filter((unit) => unit.status === 'available').length;

  return (
    <Page>
      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">{track.title}</h1>
      <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">{track.subtitle}</p>

      <p className="measure mt-8 rounded-xl border-s-2 border-accent bg-accent-soft/40 px-5 py-4 text-muted">
        <span className="block text-xs tracking-[0.14em] text-subtle uppercase">
          What you will be able to do
        </span>
        <span className="mt-1.5 block text-ink">{track.promise}</span>
      </p>

      <p className="mt-8 text-sm text-subtle">
        {track.units.length} units ·{' '}
        {authored === 0
          ? 'curriculum written, lessons in production'
          : `${authored} of ${track.units.length} units available now`}
      </p>

      <div className="mt-8">
        <UnitMap track={track} />
      </div>
    </Page>
  );
}
