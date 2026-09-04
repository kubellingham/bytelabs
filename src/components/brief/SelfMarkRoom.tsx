'use client';

import { useCallback, useMemo, useState } from 'react';

import { Workspace } from '@/components/editor/Workspace';
import type { BriefTask } from '@/lib/brief/types';

interface Props {
  task: BriefTask;
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onPass: () => void;
}

/**
 * The fallback room. Used when the language isn't one we can run in-browser yet
 * (Java, C, SQL, ...) — the learner writes the code here, runs it wherever they
 * usually run that language, and marks it done when the output matches.
 */
export function SelfMarkRoom({ task, files, onFilesChange, onPass }: Props) {
  const paths = useMemo(() => Object.keys(files), [files]);
  const [activePath, setActivePath] = useState(paths[0] ?? 'main.txt');
  const activeFile = files[activePath] !== undefined ? activePath : (paths[0] ?? 'main.txt');

  const handleChange = useCallback(
    (path: string, value: string) => onFilesChange({ ...files, [path]: value }),
    [files, onFilesChange],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and self-mark">
      <div className="flex min-h-0 flex-1 flex-col">
        <Workspace
          files={files}
          activePath={activeFile}
          onSelect={setActivePath}
          onChange={handleChange}
        />
      </div>
      <div className="shrink-0 rounded-lg border border-line bg-surface p-4">
        <p className="text-sm text-muted">
          ByteLabs can’t run <span className="font-mono text-ink">{task.language}</span> in your
          browser yet — write the code here, run it wherever you normally would, and mark it done
          when the output matches the brief.
        </p>
        <button
          type="button"
          onClick={onPass}
          className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
        >
          Mark it done — next task
        </button>
      </div>
    </section>
  );
}
