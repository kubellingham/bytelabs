'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Page } from '@/components/shell/Page';
import type { TopicContext } from '@/lib/kube/types';

type HandoffState =
  | { phase: 'exchanging' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; topic: TopicContext };

function HandoffContent() {
  const params = useSearchParams();
  const code = params.get('code');

  const [state, setState] = useState<HandoffState>(() =>
    code ? { phase: 'exchanging' } : { phase: 'error', message: 'No handoff code provided.' },
  );

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    async function exchange() {
      try {
        const res = await fetch('/api/handoff/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Exchange failed.' }));
          setState({ phase: 'error', message: data.error || 'Exchange failed.' });
          return;
        }

        const topic: TopicContext = await res.json();
        setState({ phase: 'ready', topic });

        try {
          sessionStorage.setItem('bytelabs.handoff', JSON.stringify(topic));
        } catch { /* sessionStorage unavailable */ }

        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- practice route not built yet
        window.location.assign(
          `/practice/${encodeURIComponent(topic.courseId)}/${encodeURIComponent(topic.topicId)}`,
        );
      } catch (err) {
        if (cancelled) return;
        setState({
          phase: 'error',
          message: err instanceof Error ? err.message : 'Network error.',
        });
      }
    }

    exchange();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {state.phase === 'exchanging' && (
        <>
          <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <h1 className="text-lg font-medium">Loading your practice session...</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Connecting with Studying Kube
          </p>
        </>
      )}
      {state.phase === 'error' && (
        <>
          <h1 className="text-lg font-medium">Something went wrong</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{state.message}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Go to ByteLabs
          </Link>
        </>
      )}
      {state.phase === 'ready' && (
        <>
          <h1 className="text-lg font-medium">Ready!</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Loading {state.topic.topicTitle}...
          </p>
        </>
      )}
    </div>
  );
}

export default function HandoffPage() {
  return (
    <Page>
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-6 py-24 text-center">
            <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        }
      >
        <HandoffContent />
      </Suspense>
    </Page>
  );
}
