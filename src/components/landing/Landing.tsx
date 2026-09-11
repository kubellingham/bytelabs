'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signInWithGoogle } from '@/lib/firebase/client';

/**
 * The public landing page.
 *
 * A signed-out visitor lands here. One primary CTA — Continue with
 * Google — plus a preview of what the walkthrough actually looks like
 * on the right, and three feature cards below that show ByteLabs'
 * shape without hiding that Courses and Grounds aren't ready yet.
 *
 * Sign-in delegates to Firebase; the auth-state watcher in
 * `useUser()` picks it up and the `/` page redirects to `/brief`.
 * When Firebase is not configured (self-hosters, dev boxes), the
 * button falls back to a link straight into `/brief` so nothing is
 * lost — the app already treats unconfigured auth as pass-through.
 */
export function Landing() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok && result.reason === 'unconfigured') {
        // Dev/self-host path: no Firebase, just walk in.
        router.push('/brief');
        return;
      }
      // On success, the auth watcher flips state and `/` redirects.
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <Header />
      <Hero onSignIn={onSignIn} busy={busy} error={error} />
      <Zones />
      <Foot />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4 md:px-20">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-mono text-sm font-bold text-on-accent"
        >
          B
        </span>
        <span className="font-mono text-[15px] font-semibold tracking-tight">bytelabs</span>
        <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
          beta
        </span>
      </div>
      <nav className="flex items-center gap-6 text-sm text-muted">
        <a
          href="https://github.com/kubellingham/bytelabs"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-ink"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}

function Hero({
  onSignIn,
  busy,
  error,
}: {
  onSignIn: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <section className="mx-auto grid max-w-[1440px] gap-16 px-6 py-16 md:grid-cols-2 md:gap-24 md:px-20 md:py-24">
      <div className="flex flex-col justify-center gap-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          The BYO lab · Python-first
        </p>
        <h1 className="text-[length:var(--bl-step-4)] leading-[1.06] font-bold tracking-tight text-pretty text-ink">
          Paste a task.
          <br />
          Learn it end to end.
        </h1>
        <p className="max-w-xl text-[length:var(--bl-step-1)] leading-relaxed text-pretty text-muted">
          Drop in any coding question — a syllabus item, a worksheet, a stray demo — and ByteLabs
          turns it into a runnable walkthrough. Read the solution, take it apart beat by beat,
          type it from memory, then defend it in a viva.
        </p>

        <div className="mt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={onSignIn}
            disabled={busy}
            className="inline-flex w-fit items-center gap-3 rounded-xl border border-line-strong bg-surface px-6 py-3.5 text-[15px] font-medium text-ink shadow-sm transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleG />
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>
          <p className="text-sm text-subtle">
            No sign-up flow. Anonymous sessions save locally for 24 hours.
          </p>
          {error ? (
            <p role="alert" className="text-sm text-attention">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="ms-1 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          What you land in
        </p>
        <WalkthroughPreview />
      </div>
    </section>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.17 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

/**
 * A static preview of the first beat of a walkthrough — same visual
 * vocabulary as the real thing so the CTA promise reads as concrete.
 * Not a live component; this is a landing-page picture.
 */
function WalkthroughPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
            walkthrough
          </span>
          <span aria-hidden="true" className="text-subtle">
            /
          </span>
          <span className="truncate text-muted">Determine if a number is prime</span>
        </div>
        <span className="font-mono text-[11px] text-subtle">Beat 1 of 5</span>
      </div>
      <div className="grid grid-cols-[minmax(0,220px)_1fr]">
        <div className="border-e border-line p-5">
          <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">
            First — the idea
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            We start with a candidate number and ask: does anything besides 1 and itself divide it
            evenly?
          </p>
          <div className="mt-4 flex items-center gap-1.5">
            <span aria-hidden="true" className="h-1 w-3.5 rounded-full bg-accent" />
            <span aria-hidden="true" className="h-1 w-3.5 rounded-full bg-line-strong" />
            <span aria-hidden="true" className="h-1 w-3.5 rounded-full bg-line-strong" />
            <span aria-hidden="true" className="h-1 w-3.5 rounded-full bg-line-strong" />
            <span aria-hidden="true" className="h-1 w-3.5 rounded-full bg-line-strong" />
          </div>
          <div className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-medium text-on-accent">
            Show me the code →
          </div>
        </div>
        <pre className="overflow-x-auto bg-code p-5 font-mono text-[12.5px] leading-relaxed text-ink">
          <span className="opacity-30">n = int(input(&quot;Enter a number: &quot;))</span>
          {'\n'}
          <span className="opacity-30">is_prime = True</span>
          {'\n'}
          <span className="rounded bg-accent-soft px-1 shadow-[0_0_0_2px_var(--color-accent-soft)]">
            for i in range(2, n):
          </span>
          {'\n'}
          <span className="opacity-30">    if n % i == 0:</span>
          {'\n'}
          <span className="opacity-30">        is_prime = False</span>
          {'\n'}
          <span className="opacity-30">        break</span>
          {'\n'}
          <span className="opacity-30">if is_prime:</span>
          {'\n'}
          <span className="opacity-30">    print(n, &quot;is prime&quot;)</span>
        </pre>
      </div>
    </div>
  );
}

function Zones() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-4 pb-24 md:px-20">
      <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
        What&apos;s in the app
      </p>
      <h2 className="mt-3 text-[length:var(--bl-step-3)] font-semibold tracking-tight text-ink">
        Three zones — one available today
      </h2>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <ZoneCard
          eyebrow="Brief"
          eyebrowClassName="text-accent"
          status="Available now"
          statusTone="success"
          title="Bring your own task"
          body="Paste any coding question. Get a runnable session with a task room, a solve walkthrough, a rewrite drill, and a viva."
          chips={['Python', 'HTML', 'Pyodide runs in your browser']}
        />
        <ZoneCard
          eyebrow="Courses"
          status="Coming soon"
          statusTone="muted"
          title="Author-led tracks"
          body="Curated modules that pair a Studying Kube theory lesson with a hands-on ByteLabs practical — the taught path."
          disabled
        />
        <ZoneCard
          eyebrow="Grounds"
          status="Coming soon"
          statusTone="muted"
          title="Open challenges"
          body="A rotating bank of practice tasks — daily, weekly, and themed — with leaderboards and public solves."
          disabled
        />
      </div>
    </section>
  );
}

function ZoneCard({
  eyebrow,
  eyebrowClassName,
  status,
  statusTone,
  title,
  body,
  chips,
  disabled,
}: {
  eyebrow: string;
  eyebrowClassName?: string;
  status: string;
  statusTone: 'success' | 'muted';
  title: string;
  body: string;
  chips?: string[];
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-6 ${
        disabled ? 'border-line bg-sunken opacity-70' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`font-mono text-[11px] tracking-[0.18em] uppercase ${
            eyebrowClassName ?? 'text-subtle'
          }`}
        >
          {eyebrow}
        </p>
        {statusTone === 'success' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-medium text-success">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
            {status}
          </span>
        ) : (
          <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] font-medium text-muted">
            {status}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
      {chips ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded bg-sunken px-2 py-0.5 font-mono text-[11px] text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {disabled ? (
        <a
          href="mailto:hi@bytelabs.dev?subject=Waitlist"
          className="mt-1 text-[13px] text-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
        >
          Join the waitlist →
        </a>
      ) : null}
    </div>
  );
}

function Foot() {
  return (
    <footer className="border-t border-line px-6 py-8 md:px-20">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-3 text-sm text-subtle md:flex-row md:items-center">
        <p>Built for computer-science students. Open source · MIT.</p>
        <div className="flex gap-6">
          <a href="#" className="text-muted hover:text-ink">
            Privacy
          </a>
          <a href="#" className="text-muted hover:text-ink">
            Terms
          </a>
          <a
            href="https://github.com/kubellingham/bytelabs"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'The sign-in window was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup — allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was already in progress.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    default:
      return 'Could not sign you in just now. Try again in a moment.';
  }
}
