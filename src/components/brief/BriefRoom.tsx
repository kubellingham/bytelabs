'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AssistPanel } from '@/components/assist/AssistPanel';
import { Prose } from '@/components/course/Prose';
import { loadWorkspace, saveWorkspace } from '@/lib/brief/storage';
import type { BriefSession, BriefTask } from '@/lib/brief/types';

import { HtmlRoom } from './HtmlRoom';
import { PythonRoom } from './PythonRoom';
import { SelfMarkRoom } from './SelfMarkRoom';

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

  const [files, setFiles] = useState<Record<string, string>>(() => {
    const saved = loadWorkspace(session.id, task.id);
    if (saved && Object.keys(saved).length > 0) return saved;
    if (Object.keys(task.starterFiles).length > 0) return { ...task.starterFiles };
    return { [defaultFileFor(task)]: '' };
  });

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
        <p className="text-xs text-subtle">
          Task {index + 1} of {session.tasks.length}
        </p>
      </header>

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

      <AssistPanel
        context={{
          zone: 'ground-assisted',
          title: `${session.sourceLabel} — ${task.title}`,
          files,
        }}
      />
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
