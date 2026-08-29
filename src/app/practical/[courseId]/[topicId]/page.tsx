'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PracticalRunner } from '@/components/practical/PracticalRunner';
import type { HandoffSession } from '@/lib/kube/types';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; session: HandoffSession };

function loadSession(courseId: string, topicId: string): State {
  try {
    const raw = sessionStorage.getItem('bytelabs.handoff');
    if (!raw) {
      return { phase: 'error', message: 'No practice session found. Please start from Studying Kube.' };
    }

    const session: HandoffSession = JSON.parse(raw);

    if (session.exchange.courseId !== courseId || session.exchange.topicId !== topicId) {
      return {
        phase: 'error',
        message: 'Session mismatch. Please start a new practice session from Studying Kube.',
      };
    }

    return { phase: 'ready', session };
  } catch {
    return { phase: 'error', message: 'Could not load practice session.' };
  }
}

export default function PracticalPage() {
  const params = useParams<{ courseId: string; topicId: string }>();
  const [state] = useState<State>(() => loadSession(params.courseId, params.topicId));

  if (state.phase === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-accent" />
          <p className="text-sm text-muted">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-lg font-medium text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent"
          >
            Go to ByteLabs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main id="main">
      <PracticalRunner session={state.session} />
    </main>
  );
}
