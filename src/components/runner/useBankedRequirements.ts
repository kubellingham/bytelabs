'use client';

import { useEffect, useMemo } from 'react';

import type { Requirement } from '@/lib/content/checks';
import type { WorkspaceFiles } from '@/lib/content/schema';
import { satisfyRequirement, saveWorkspace } from '@/lib/progress';
import { useProgress, useProgressActions } from '@/lib/storage/useProgress';

import type { RequirementResult } from './useRequirements';

const SAVE_DEBOUNCE_MS = 1200;

/**
 * Banks requirements as they go green, and keeps the learner's work saved.
 *
 * Banking is additive and idempotent: a requirement satisfied once stays satisfied
 * even if the learner keeps editing and momentarily breaks it. Watching a tick
 * disappear mid-edit would read as punishment, and the brief is explicit that there
 * is no failure state.
 *
 * `satisfyRequirement` returns the same state object when there is nothing new, and
 * the store skips notifying on an unchanged reference, so this settles rather than
 * looping.
 */
export function useBankedRequirements({
  requirements,
  results,
  scope,
  files,
  workspaceKey,
}: {
  requirements: readonly Requirement[];
  results: Record<string, RequirementResult>;
  scope: { kind: 'unit'; id: string } | { kind: 'scenario'; id: string; variantId: string };
  files: WorkspaceFiles;
  workspaceKey: string;
}): { banked: readonly string[]; satisfiedIds: ReadonlySet<string>; complete: boolean } {
  const progress = useProgress();
  const { update } = useProgressActions();

  const banked = useMemo(
    () =>
      scope.kind === 'unit'
        ? (progress.units[scope.id]?.satisfiedRequirements ?? [])
        : (progress.scenarios[scope.id]?.satisfiedRequirements ?? []),
    [progress, scope],
  );

  const scopeKey = scope.kind === 'unit' ? `unit:${scope.id}` : `scenario:${scope.id}`;

  useEffect(() => {
    const newly = requirements.filter(
      (requirement) => results[requirement.id]?.satisfied && !banked.includes(requirement.id),
    );
    if (newly.length === 0) return;

    update((state) => {
      let next = state;
      for (const requirement of newly) {
        next = satisfyRequirement(next, scope, requirement.id, requirement.concepts);
      }
      return next;
    });
    // `scope` is an object literal at every call site, so its identity is not a
    // useful dependency; `scopeKey` is the stable form of the same information.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirements, results, banked, scopeKey, update]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      update((state) => saveWorkspace(state, workspaceKey, files));
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [files, workspaceKey, update]);

  const satisfiedIds = useMemo(() => {
    const ids = new Set(banked);
    for (const requirement of requirements) {
      if (results[requirement.id]?.satisfied) ids.add(requirement.id);
    }
    return ids;
  }, [banked, requirements, results]);

  return {
    banked,
    satisfiedIds,
    complete: requirements.length > 0 && satisfiedIds.size === requirements.length,
  };
}
