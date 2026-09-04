'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { BriefRoom } from '@/components/brief/BriefRoom';
import { loadSession } from '@/lib/brief/storage';
import type { BriefSession } from '@/lib/brief/types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'missing' }
  | { phase: 'ready'; session: BriefSession; index: number };

interface Params {
  sessionId: string;
  taskIndex: string;
}

function resolveState(sessionId: string, taskIndex: string): LoadState {
  const session = loadSession(sessionId);
  if (!session) return { phase: 'missing' };
  const index = Number.parseInt(taskIndex, 10);
  if (!Number.isFinite(index) || index < 0 || index >= session.tasks.length) {
    return { phase: 'missing' };
  }
  return { phase: 'ready', session, index };
}

export default function BriefTaskPage({ params }: { params: Promise<Params> }) {
  const { sessionId, taskIndex } = use(params);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    // localStorage is an external store; the load "settles once per params"
    // in a single setState, so there is no cascade.
    const next = resolveState(sessionId, taskIndex);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(next);
  }, [sessionId, taskIndex]);

  if (state.phase === 'loading') {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="text-sm text-muted">Loading your brief…</p>
      </div>
    );
  }
  if (state.phase === 'missing') {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-lg font-medium text-ink">This brief isn’t here anymore.</h1>
        <p className="mt-2 text-sm text-muted">
          Briefs live in your browser for 24 hours. Paste it again to start over.
        </p>
        <Link
          href="/brief"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"
        >
          New brief
        </Link>
      </div>
    );
  }
  return <BriefRoom session={state.session} index={state.index} />;
}
