'use client';

import { useEditorZoom } from '@/lib/brief/editor-zoom';

/**
 * The small A- / A+ row that sits in each editor's header. Reads the
 * shared zoom level from the store, so all editors move together — the
 * choice a learner makes in one task carries over to the next.
 */
export function EditorZoomControls() {
  const { scale, zoomIn, zoomOut, reset } = useEditorZoom();

  return (
    <div
      className="flex items-center gap-1 text-[10px] tracking-[0.14em] text-subtle uppercase"
      role="group"
      aria-label="Editor text size"
    >
      <button
        type="button"
        onClick={zoomOut}
        aria-label="Decrease editor text size"
        title="Smaller text (⌘/Ctrl −)"
        className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] transition-colors hover:border-accent/40 hover:text-ink"
      >
        A−
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label={`Reset editor text size (currently ${Math.round(scale * 100)}%)`}
        title="Reset (⌘/Ctrl 0)"
        className="rounded border border-transparent px-1.5 py-0.5 font-mono text-[10px] transition-colors hover:border-line hover:text-ink"
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        onClick={zoomIn}
        aria-label="Increase editor text size"
        title="Larger text (⌘/Ctrl =)"
        className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] transition-colors hover:border-accent/40 hover:text-ink"
      >
        A+
      </button>
    </div>
  );
}
