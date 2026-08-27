'use client';

import { useMemo } from 'react';

import type { WorkspaceFiles } from '@/lib/content/schema';
import type { GhostState } from '@/lib/editor/ghost';

import { CodeEditor } from './CodeEditor';

export interface WorkspaceProps {
  files: WorkspaceFiles;
  activePath: string;
  onSelect: (path: string) => void;
  onChange: (path: string, value: string) => void;
  /** Ghost state per file path. Absent means no scaffolding for that file. */
  ghosts?: Record<string, GhostState>;
  readOnly?: boolean;
}

function iconFor(path: string): string {
  if (/\.css$/i.test(path)) return '#';
  if (/\.html?$/i.test(path)) return '<>';
  if (/\.js$/i.test(path)) return '{}';
  return '·';
}

/**
 * The multi-file editor.
 *
 * Multi-file from the first commit rather than retrofitted: Unit 1's fifth chapter
 * is "Connecting CSS", which means nothing with a single pane, and a single-file
 * editor would teach a habit the curriculum then has to undo.
 */
export function Workspace({
  files,
  activePath,
  onSelect,
  onChange,
  ghosts,
  readOnly = false,
}: WorkspaceProps) {
  const paths = useMemo(
    () =>
      Object.keys(files).sort((a, b) => {
        // The entry point first; everything else alphabetical.
        if (a === 'index.html') return -1;
        if (b === 'index.html') return 1;
        return a.localeCompare(b);
      }),
    [files],
  );

  const active = files[activePath] !== undefined ? activePath : (paths[0] ?? '');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-code">
      <div role="tablist" aria-label="Files" className="flex shrink-0 border-b border-line">
        {paths.map((path) => {
          const selected = path === active;
          return (
            <button
              key={path}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => onSelect(path)}
              className={`flex items-center gap-2 border-r border-line px-4 py-2 font-mono text-xs transition-colors ${
                selected
                  ? 'bg-raised text-ink'
                  : 'text-subtle hover:bg-raised/60 hover:text-muted'
              }`}
            >
              <span aria-hidden="true" className="text-accent opacity-70">
                {iconFor(path)}
              </span>
              {path}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        {active ? (
          <CodeEditor
            key={active}
            path={active}
            value={files[active] ?? ''}
            onChange={(value) => onChange(active, value)}
            {...(ghosts?.[active] ? { ghost: ghosts[active] } : {})}
            readOnly={readOnly}
          />
        ) : null}
      </div>
    </div>
  );
}
