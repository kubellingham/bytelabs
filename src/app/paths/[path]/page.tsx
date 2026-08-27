import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LEARNING_PATHS, getTrackById } from '@/content';

export function generateStaticParams() {
  return LEARNING_PATHS.map((path) => ({ path: path.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }) {
  const slug = (await params).path;
  const path = LEARNING_PATHS.find((candidate) => candidate.slug === slug);
  return { title: path?.title ?? 'Path' };
}

export default async function PathPage({ params }: { params: Promise<{ path: string }> }) {
  const slug = (await params).path;
  const path = LEARNING_PATHS.find((candidate) => candidate.slug === slug);
  if (!path) notFound();

  return (
    <main id="main" className="mx-auto max-w-3xl px-8 py-16">
      <Link
        href="/"
        className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase hover:underline"
      >
        ← ByteLabs
      </Link>

      <h1 className="mt-6 text-[length:var(--bl-step-4)] font-semibold text-ink">{path.title}</h1>
      <p className="measure mt-3 text-[length:var(--bl-step-1)] text-muted">{path.subtitle}</p>
      <p className="measure mt-6 text-muted">{path.description}</p>

      <ol className="mt-12 space-y-3">
        {path.trackIds.map((id, index) => {
          const track = getTrackById(id);
          if (!track) return null;
          const available = track.status === 'available';

          return (
            <li key={id}>
              {available ? (
                <Link
                  href={`/tracks/${track.slug}`}
                  className="group block rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-accent/40"
                >
                  <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
                    Track {index + 1}
                  </p>
                  <h2 className="mt-1 text-[length:var(--bl-step-1)] font-semibold text-ink group-hover:text-accent">
                    {track.title}
                  </h2>
                  <p className="measure mt-1 text-sm text-muted">{track.subtitle}</p>
                  <p className="measure mt-3 text-sm text-accent">{track.promise}</p>
                </Link>
              ) : (
                <div className="rounded-xl border border-line/60 bg-surface/40 px-5 py-4">
                  <p className="font-mono text-[11px] tracking-[0.16em] text-subtle uppercase">
                    Track {index + 1} · curriculum written
                  </p>
                  <h2 className="mt-1 text-[length:var(--bl-step-1)] font-semibold text-muted">
                    {track.title}
                  </h2>
                  <p className="measure mt-1 text-sm text-muted">{track.subtitle}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
