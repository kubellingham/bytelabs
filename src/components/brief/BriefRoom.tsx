'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AssistPanel } from '@/components/assist/AssistPanel';
import { Prose } from '@/components/course/Prose';
import { solveResponseSchema, type SolveResponse } from '@/lib/brief/solve-types';
import {
  dismissOnRamp,
  isOnRampDismissed,
  loadSolve,
  loadWorkspace,
  saveSolve,
  saveWorkspace,
} from '@/lib/brief/storage';
import type { BriefSession, BriefTask } from '@/lib/brief/types';

import { HtmlRoom } from './HtmlRoom';
import { OnRamp } from './OnRamp';
import { PythonRoom } from './PythonRoom';
import { SelfMarkRoom } from './SelfMarkRoom';
import { SolveWalkthrough } from './SolveWalkthrough';

interface Props {
  session: BriefSession;
  index: number;
}

/**
 * The BYO room. Dispatches to a language-specific runner and holds the shared
 * shell — brief on the left, editor/runner/output on the right, task pager at
 * the top.
 */
export function BriefRoom({ session, index }: Props) {
  const task = session.tasks[index];
  if (!task) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-lg font-medium">This task isn’t in that brief.</h1>
        <Link
          href={`/brief/${session.id}`}
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent"
        >
          Back to the task list
        </Link>
      </div>
    );
  }
  // Keyed on the task id so React remounts the whole room when the learner
  // moves between tasks: each task gets a fresh useState-based workspace
  // seeded from its own starter files, rather than an effect that re-syncs.
  return <TaskRoom key={task.id} session={session} index={index} task={task} />;
}

interface TaskRoomProps {
  session: BriefSession;
  index: number;
  task: BriefTask;
}

function TaskRoom({ session, index, task }: TaskRoomProps) {
  const router = useRouter();

  const [onRampOpen, setOnRampOpen] = useState<boolean>(
    () => task.concepts.length > 0 && !isOnRampDismissed(session.id, task.id),
  );

  const closeOnRamp = useCallback(() => {
    dismissOnRamp(session.id, task.id);
    setOnRampOpen(false);
  }, [session.id, task.id]);

  const reopenOnRamp = useCallback(() => {
    setOnRampOpen(true);
  }, []);

  const [files, setFiles] = useState<Record<string, string>>(() => {
    const saved = loadWorkspace(session.id, task.id);
    if (saved && Object.keys(saved).length > 0) return saved;
    if (Object.keys(task.starterFiles).length > 0) return { ...task.starterFiles };
    return { [defaultFileFor(task)]: '' };
  });

  type WalkState =
    | { phase: 'closed' }
    | { phase: 'loading' }
    | { phase: 'error'; message: string }
    | { phase: 'open'; solve: SolveResponse };

  const [walk, setWalk] = useState<WalkState>({ phase: 'closed' });

  const openWalkthrough = useCallback(async () => {
    // Cached from a previous open? Show it instantly and skip the call.
    const cached = loadSolve(session.id, task.id);
    if (cached) {
      const parsed = solveResponseSchema.safeParse(cached);
      if (parsed.success) {
        setWalk({ phase: 'open', solve: parsed.data });
        return;
      }
    }

    setWalk({ phase: 'loading' });
    try {
      const res = await fetch('/api/brief/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'The walkthrough could not be built.' }));
        setWalk({
          phase: 'error',
          message: typeof data.message === 'string' ? data.message : 'Something went wrong.',
        });
        return;
      }
      const data = (await res.json()) as unknown;
      const parsed = solveResponseSchema.safeParse(data);
      if (!parsed.success) {
        setWalk({ phase: 'error', message: 'The walkthrough author returned an unexpected shape.' });
        return;
      }
      saveSolve(session.id, task.id, parsed.data);
      setWalk({ phase: 'open', solve: parsed.data });
    } catch (err) {
      setWalk({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  }, [session.id, task]);

  const closeWalkthrough = useCallback(() => setWalk({ phase: 'closed' }), []);

  const onFilesChange = useCallback(
    (next: Record<string, string>) => {
      setFiles(next);
      saveWorkspace(session.id, task.id, next);
    },
    [session.id, task.id],
  );

  const onPass = useCallback(() => {
    const next = index + 1;
    if (next >= session.tasks.length) {
      router.push(`/brief/${session.id}`);
      return;
    }
    router.push(`/brief/${session.id}/${next}`);
  }, [index, session.id, session.tasks.length, router]);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <Link href="/" className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            ByteLabs
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <Link href="/brief" className="text-muted hover:text-ink">
            The Brief
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <Link
            href={`/brief/${session.id}`}
            className="truncate text-subtle hover:text-ink"
          >
            {session.sourceLabel}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => void openWalkthrough()}
            disabled={walk.phase === 'loading'}
            className="rounded-lg border border-accent/40 bg-accent-soft/50 px-3 py-1.5 text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {walk.phase === 'loading' ? 'Building…' : 'Show me one way'}
          </button>
          {walk.phase === 'error' ? (
            <span role="status" className="text-danger">
              {walk.message}
            </span>
          ) : null}
          {!onRampOpen && task.concepts.length > 0 ? (
            <button
              type="button"
              onClick={reopenOnRamp}
              className="rounded-lg border border-line px-3 py-1.5 text-muted transition-colors hover:text-ink"
            >
              On-ramp
            </button>
          ) : null}
          <p className="text-subtle">
            Task {index + 1} of {session.tasks.length}
          </p>
        </div>
      </header>

      {onRampOpen ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OnRamp
            taskTitle={task.title}
            concepts={task.concepts}
            onDismiss={closeOnRamp}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="bl-scroll w-[clamp(21rem,32%,28rem)] shrink-0 overflow-y-auto border-e border-line">
            <div className="px-7 py-9">
              <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
                {task.language}
              </p>
              <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
                {task.title}
              </h1>
              <div className="mt-6">
                <Prose blocks={promptToProse(task.prompt)} />
              </div>

              <nav aria-label="Task navigation" className="mt-8 flex gap-2">
                {index > 0 ? (
                  <Link
                    href={`/brief/${session.id}/${index - 1}`}
                    className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
                  >
                    ← Previous
                  </Link>
                ) : null}
                {index + 1 < session.tasks.length ? (
                  <Link
                    href={`/brief/${session.id}/${index + 1}`}
                    className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
                  >
                    Skip →
                  </Link>
                ) : null}
              </nav>
            </div>
          </aside>

          {renderRuntime({ task, files, onFilesChange, onPass })}
        </div>
      )}

      <AssistPanel
        context={{
          zone: 'ground-assisted',
          title: `${session.sourceLabel} — ${task.title}`,
          files,
        }}
      />

      {walk.phase === 'open' ? (
        <SolveWalkthrough
          taskTitle={task.title}
          solve={walk.solve}
          onClose={closeWalkthrough}
        />
      ) : null}
    </div>
  );
}

interface RuntimeArgs {
  task: BriefTask;
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onPass: () => void;
}

function renderRuntime(args: RuntimeArgs) {
  switch (args.task.language) {
    case 'python':
      return <PythonRoom {...args} />;
    case 'html':
    case 'css':
    case 'javascript':
      return <HtmlRoom {...args} />;
    default:
      return <SelfMarkRoom {...args} />;
  }
}

function defaultFileFor(task: BriefTask): string {
  switch (task.language) {
    case 'python':
      return 'main.py';
    case 'html':
      return 'index.html';
    case 'css':
      return 'styles.css';
    case 'javascript':
      return 'main.js';
    default:
      return 'main.txt';
  }
}

/**
 * The prompt is a plain multi-paragraph string from the parser. We split on blank
 * lines to feed it through the existing Prose renderer, which knows how to style
 * paragraphs, lists, and notes deliberately. This is coarse — future parses can
 * emit rich Prose blocks directly.
 */
function promptToProse(prompt: string): Array<{ kind: 'p'; text: string }> {
  return prompt
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((text) => ({ kind: 'p' as const, text }));
}
