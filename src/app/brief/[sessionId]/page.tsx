'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { Page } from '@/components/shell/Page';
import { loadSession } from '@/lib/brief/storage';
import type { BriefSession } from '@/lib/brief/types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'missing' }
  | { phase: 'ready'; session: BriefSession };

const LANGUAGE_ICON: Record<string, string> = {
  python: '🐍',
  javascript: '{ }',
  html: '<>',
  css: '#',
  other: '·',
};

export default function BriefSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    // localStorage is an external store — the "settle once per sessionId"
    // idiom fires the rule, but there is no cascade: setState lands in one
    // step and never re-triggers this effect.
    const session = loadSession(sessionId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(session ? { phase: 'ready', session } : { phase: 'missing' });
  }, [sessionId]);

  if (state.phase === 'loading') {
    return (
      <Page>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      </Page>
    );
  }
  if (state.phase === 'missing') {
    return (
      <Page>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
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
      </Page>
    );
  }

  const { session } = state;
  return (
    <Page>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
          The Brief
        </p>
        <h1 className="mt-3 text-[length:var(--bl-step-2)] font-semibold text-ink">
          {session.sourceLabel}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {session.tasks.length} task{session.tasks.length === 1 ? '' : 's'}. Start with any — the
          order is a suggestion, not a requirement.
        </p>

        <ol className="mt-8 space-y-3">
          {session.tasks.map((task, index) => (
            <li key={task.id}>
              <Link
                href={`/brief/${session.id}/${index}`}
                className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-raised/40"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-raised font-mono text-sm text-accent"
                >
                  {LANGUAGE_ICON[task.language] ?? LANGUAGE_ICON.other}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
                    Task {index + 1} · {task.language}
                  </p>
                  <p className="mt-1 font-medium text-ink">{task.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {task.prompt}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/brief"
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            New brief
          </Link>
        </div>
      </div>
    </Page>
  );
}
