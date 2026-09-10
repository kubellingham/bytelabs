import Link from 'next/link';

interface Props {
  zone: 'Courses' | 'Grounds';
  pitch: string;
}

/**
 * Placeholder for zones that aren't shipping yet. Keeps the URL live
 * (nothing 404s), states the shape honestly, and offers a way back
 * to the one zone that is ready.
 */
export function ComingSoon({ zone, pitch }: Props) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 py-24 md:py-32">
        <Link
          href="/brief"
          className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase transition-colors hover:text-ink"
        >
          ← Back to Brief
        </Link>

        <p className="rounded-full border border-line-strong px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          {zone} · Coming soon
        </p>

        <h1 className="text-[length:var(--bl-step-3)] leading-tight font-semibold tracking-tight text-ink">
          {zone} isn&apos;t ready yet — the Brief is.
        </h1>

        <p className="text-[length:var(--bl-step-1)] leading-relaxed text-muted">{pitch}</p>

        <p className="text-sm text-subtle">
          We&apos;re building this out next. If you want a nudge when it lands, drop us a line and
          we&apos;ll add you to the waitlist.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/brief"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
          >
            Try the Brief instead →
          </Link>
          <a
            href="mailto:hi@bytelabs.dev?subject=Waitlist"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Email me when it&apos;s live
          </a>
        </div>
      </div>
    </div>
  );
}
