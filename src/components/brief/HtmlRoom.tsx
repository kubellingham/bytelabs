'use client';

import { useCallback, useMemo, useState } from 'react';

import { Workspace } from '@/components/editor/Workspace';
import { Preview } from '@/components/runner/Preview';
import type { BriefTask } from '@/lib/brief/types';

interface Props {
  task: BriefTask;
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onPass: () => void;
}

/**
 * The HTML / CSS / JS room. Reuses the existing sandboxed Preview iframe.
 *
 * For MVP the verdict is self-mark: BYO tasks don't come with the fine-grained
 * requirement DSL that authored scenarios have, so the learner clicks
 * "It's ready" when the preview looks right. A later slice teaches the parser
 * to emit lowerable checks and this becomes automatic.
 */
export function HtmlRoom({ task, files, onFilesChange, onPass }: Props) {
  const [activePath, setActivePath] = useState(() => {
    if (files['index.html']) return 'index.html';
    return Object.keys(files)[0] ?? 'index.html';
  });

  const paths = useMemo(() => Object.keys(files), [files]);
  const activeFile =
    files[activePath] !== undefined ? activePath : (paths[0] ?? 'index.html');

  const handleChange = useCallback(
    (path: string, value: string) => onFilesChange({ ...files, [path]: value }),
    [files, onFilesChange],
  );

  const expected = task.expected;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and preview">
      <div className="flex min-h-0 flex-[3] flex-col">
        <Workspace
          files={files}
          activePath={activeFile}
          onSelect={setActivePath}
          onChange={handleChange}
        />
      </div>

      <div className="flex min-h-0 flex-[2] flex-col">
        <p className="mb-1.5 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
          Preview
        </p>
        <Preview files={files} className="min-h-0 flex-1" />
      </div>

      <div className="shrink-0">
        {expected.kind === 'html-contains' ? (
          <p className="mb-3 text-xs text-subtle">
            The brief wants the page to contain: <code className="rounded bg-raised px-1 text-ink">{expected.value}</code>
          </p>
        ) : null}
        <button
          type="button"
          onClick={onPass}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          It’s ready — next task
        </button>
      </div>
    </section>
  );
}
