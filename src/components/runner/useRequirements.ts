'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Requirement } from '@/lib/content/checks';
import type { WorkspaceFiles } from '@/lib/content/schema';
import { bundleWorkspace } from '@/lib/runner/bundle';
import type { CheckItem, CheckOutcome } from '@/lib/runner/checker';
import { isSandboxMessage } from '@/lib/runner/protocol';
import { SANDBOX_RUNTIME } from '@/lib/runner/runtime';

/**
 * Width used for checks that do not specify one. Fixed rather than "whatever the
 * preview pane happens to be" so a requirement means the same thing for every
 * learner regardless of their window size.
 */
export const DEFAULT_PROBE_WIDTH = 1280;
const PROBE_HEIGHT = 900;
const DEBOUNCE_MS = 400;

export interface RequirementResult {
  satisfied: boolean;
  /** What is still missing. Never phrased as a failure. */
  detail?: string;
}

export interface RequirementsState {
  results: Record<string, RequirementResult>;
  satisfiedCount: number;
  total: number;
  running: boolean;
}

interface Pass {
  width: number;
  items: CheckItem[];
}

function planPasses(requirements: readonly Requirement[]): Pass[] {
  const byWidth = new Map<number, CheckItem[]>();

  for (const requirement of requirements) {
    requirement.checks.forEach((check, index) => {
      const width =
        'atWidth' in check && typeof check.atWidth === 'number'
          ? check.atWidth
          : DEFAULT_PROBE_WIDTH;
      const item: CheckItem = { id: `${requirement.id}#${index}`, check };
      const existing = byWidth.get(width);
      if (existing) existing.push(item);
      else byWidth.set(width, [item]);
    });
  }

  // Widest first: fewer reflows on the way down, and the common case runs first.
  return [...byWidth.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([width, items]) => ({ width, items }));
}

function combine(
  requirements: readonly Requirement[],
  outcomes: Map<string, CheckOutcome>,
): Record<string, RequirementResult> {
  const results: Record<string, RequirementResult> = {};

  for (const requirement of requirements) {
    const own = requirement.checks.map(
      (_, index) => outcomes.get(`${requirement.id}#${index}`) ?? { id: '', ok: false },
    );

    if (requirement.mode === 'any') {
      const satisfied = own.some((outcome) => outcome.ok);
      const firstDetail = own.find((outcome) => !outcome.ok)?.detail;
      results[requirement.id] = satisfied
        ? { satisfied: true }
        : { satisfied: false, ...(firstDetail ? { detail: firstDetail } : {}) };
      continue;
    }

    const failing = own.find((outcome) => !outcome.ok);
    results[requirement.id] = failing
      ? { satisfied: false, ...(failing.detail ? { detail: failing.detail } : {}) }
      : { satisfied: true };
  }

  return results;
}

/**
 * Evaluates a scenario's requirements against the learner's live page.
 *
 * Checks are run in a hidden probe iframe rather than the visible preview, so
 * resizing to assert a responsive requirement never makes the preview jump around
 * while somebody is looking at it.
 */
export function useRequirements(
  files: WorkspaceFiles,
  requirements: readonly Requirement[],
  options: { enabled?: boolean } = {},
): RequirementsState {
  const enabled = options.enabled ?? true;
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const runIdRef = useRef(0);

  const [results, setResults] = useState<Record<string, RequirementResult>>({});
  const [running, setRunning] = useState(false);

  const passes = useMemo(() => planPasses(requirements), [requirements]);
  const srcdoc = useMemo(
    () => bundleWorkspace(files, { headScript: SANDBOX_RUNTIME }),
    [files],
  );

  // One probe iframe for the lifetime of the hook, parked outside the viewport.
  useEffect(() => {
    if (!enabled) return;
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${DEFAULT_PROBE_WIDTH}px;height:${PROBE_HEIGHT}px;border:0;visibility:hidden;`;
    document.body.appendChild(frame);
    frameRef.current = frame;
    return () => {
      frame.remove();
      frameRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || requirements.length === 0) return;

    let cancelled = false;
    const runId = ++runIdRef.current;

    const timer = window.setTimeout(() => {
      const frame = frameRef.current;
      if (!frame) return;

      setRunning(true);

      const collected = new Map<string, CheckOutcome>();

      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const askPass = (pass: Pass) =>
        new Promise<void>((resolve) => {
          const target = frame.contentWindow;
          if (!target) return resolve();

          const timeout = window.setTimeout(() => {
            window.removeEventListener('message', onMessage);
            resolve();
          }, 2000);

          function onMessage(event: MessageEvent) {
            if (!isSandboxMessage(event.data)) return;
            const message = event.data;
            if (message.type !== 'results' || message.runId !== runId) return;
            for (const outcome of message.outcomes) collected.set(outcome.id, outcome);
            window.clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            resolve();
          }

          window.addEventListener('message', onMessage);
          target.postMessage(
            { source: 'bytelabs', type: 'evaluate', runId, items: pass.items },
            '*',
          );
        });

      const waitForReady = () =>
        new Promise<void>((resolve) => {
          const timeout = window.setTimeout(() => {
            window.removeEventListener('message', onReady);
            resolve();
          }, 3000);
          function onReady(event: MessageEvent) {
            if (!isSandboxMessage(event.data) || event.data.type !== 'ready') return;
            window.clearTimeout(timeout);
            window.removeEventListener('message', onReady);
            resolve();
          }
          window.addEventListener('message', onReady);
          frame.srcdoc = srcdoc;
        });

      void (async () => {
        await waitForReady();
        if (cancelled || runIdRef.current !== runId) return;

        for (const pass of passes) {
          frame.style.width = `${pass.width}px`;
          await nextFrame();
          if (cancelled || runIdRef.current !== runId) return;
          await askPass(pass);
          if (cancelled || runIdRef.current !== runId) return;
        }

        frame.style.width = `${DEFAULT_PROBE_WIDTH}px`;
        setResults(combine(requirements, collected));
        setRunning(false);
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, srcdoc, passes, requirements]);

  const satisfiedCount = useMemo(
    () => requirements.filter((r) => results[r.id]?.satisfied).length,
    [requirements, results],
  );

  return { results, satisfiedCount, total: requirements.length, running };
}
