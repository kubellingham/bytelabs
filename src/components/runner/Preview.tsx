'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { WorkspaceFiles } from '@/lib/content/schema';
import { bundleWorkspace } from '@/lib/runner/bundle';
import { isSandboxMessage } from '@/lib/runner/protocol';
import { SANDBOX_RUNTIME } from '@/lib/runner/runtime';

const DEBOUNCE_MS = 300;

/**
 * The learner's page, rendered live.
 *
 * `allow-scripts` without `allow-same-origin` gives the frame an opaque origin: it
 * can run its own code but cannot read the parent document, its storage, or its
 * cookies. That combination is what makes it safe to run code somebody is still in
 * the middle of writing.
 */
export function Preview({ files, className }: { files: WorkspaceFiles; className?: string }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const srcdoc = useMemo(() => bundleWorkspace(files, { headScript: SANDBOX_RUNTIME }), [files]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError(null);
      if (frameRef.current) frameRef.current.srcdoc = srcdoc;
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [srcdoc]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isSandboxMessage(event.data)) return;
      if (event.data.type === 'error') setError(event.data.message);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className={`relative flex min-h-0 flex-col ${className ?? ''}`}>
      <iframe
        ref={frameRef}
        title="Your page"
        sandbox="allow-scripts allow-forms allow-modals"
        className="min-h-0 w-full flex-1 rounded-lg border border-line bg-white"
      />
      {error ? (
        <p
          role="status"
          className="absolute inset-x-3 bottom-3 rounded-md border border-attention/40 bg-attention-soft px-3 py-2 font-mono text-xs text-ink"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
