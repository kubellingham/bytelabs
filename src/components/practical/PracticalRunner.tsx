'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { AssistPanel } from '@/components/assist/AssistPanel';
import { RequirementList } from '@/components/course/RequirementList';
import { Workspace } from '@/components/editor/Workspace';
import { Preview } from '@/components/runner/Preview';
import { useBankedRequirements } from '@/components/runner/useBankedRequirements';
import { useRequirements } from '@/components/runner/useRequirements';
import type { Requirement } from '@/lib/content/checks';
import type { WorkspaceFiles } from '@/lib/content/schema';
import { authedFetch } from '@/lib/auth/authed-fetch';
import type { HandoffSession, VerdictResponse } from '@/lib/kube/types';

type Phase = 'practice' | 'submitting' | 'done';

interface PracticalRunnerProps {
  session: HandoffSession;
}

function starterFilesForTopic(session: HandoffSession): WorkspaceFiles {
  const topic = session.context.topic;
  const title = topic.title.toLowerCase();

  if (title.includes('css') || title.includes('style') || title.includes('layout')) {
    return {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic.title}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>

</body>
</html>`,
      'styles.css': `/* ${topic.title} */\n`,
    };
  }

  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic.title}</title>
</head>
<body>

</body>
</html>`,
  };
}

function requirementsFromContext(session: HandoffSession): Requirement[] {
  const requirements: Requirement[] = [];
  const tells = session.context.conceptTells;

  requirements.push({
    id: 'req-doctype',
    label: 'Page has a valid document structure',
    concepts: [],
    mode: 'all',
    checks: [
      { kind: 'element', selector: 'html' },
      { kind: 'element', selector: 'head' },
      { kind: 'element', selector: 'body' },
    ],
  });

  requirements.push({
    id: 'req-title',
    label: 'Page has a meaningful title',
    concepts: [],
    mode: 'all',
    checks: [{ kind: 'text', selector: 'title', nonEmpty: true }],
  });

  requirements.push({
    id: 'req-content',
    label: 'Page has visible content in the body',
    concepts: [],
    mode: 'all',
    checks: [{ kind: 'text', selector: 'body', nonEmpty: true }],
  });

  for (const tell of tells) {
    const term = tell.term.toLowerCase();

    if (term.includes('heading') || term.includes('h1')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses headings: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'all',
        checks: [{ kind: 'headingOutline', singleH1: true }],
      });
    } else if (term.includes('list')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses a list: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'any',
        checks: [
          { kind: 'element', selector: 'ul', min: 1 },
          { kind: 'element', selector: 'ol', min: 1 },
        ],
      });
    } else if (term.includes('image') || term.includes('img')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses images with alt text: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'all',
        checks: [
          { kind: 'element', selector: 'img', min: 1 },
          { kind: 'attribute', selector: 'img', attribute: 'alt', nonEmpty: true, everyMatch: true },
        ],
      });
    } else if (term.includes('link') || term.includes('anchor')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses links: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'all',
        checks: [
          { kind: 'element', selector: 'a', min: 1 },
          { kind: 'attribute', selector: 'a', attribute: 'href', nonEmpty: true, everyMatch: true },
        ],
      });
    } else if (term.includes('form') || term.includes('input') || term.includes('label')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses form controls: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'all',
        checks: [
          { kind: 'element', selector: 'form', min: 1 },
          { kind: 'element', selector: 'input, textarea, select', min: 1, within: 'form' },
        ],
      });
    } else if (term.includes('semantic') || term.includes('nav') || term.includes('section') || term.includes('article') || term.includes('main') || term.includes('header') || term.includes('footer')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses semantic elements: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'any',
        checks: [
          { kind: 'element', selector: 'nav, main, article, section, aside, header, footer', min: 1 },
        ],
      });
    } else if (term.includes('table')) {
      requirements.push({
        id: `req-concept-${tell.term}`,
        label: `Uses a table: ${tell.tell}`,
        concepts: [tell.term],
        mode: 'all',
        checks: [
          { kind: 'element', selector: 'table', min: 1 },
          { kind: 'element', selector: 'th', min: 1, within: 'table' },
        ],
      });
    }
  }

  if (requirements.length <= 3 && tells.length > 0) {
    requirements.push({
      id: 'req-practice',
      label: `Practice the concepts: ${tells.map((t) => t.term).join(', ')}`,
      concepts: tells.map((t) => t.term),
      mode: 'all',
      checks: [{ kind: 'text', selector: 'body', nonEmpty: true }],
    });
  }

  return requirements;
}

export function PracticalRunner({ session }: PracticalRunnerProps) {
  const { context, exchange } = session;
  const { topic, conceptTells, signals } = context;

  const starterFiles = useMemo(() => starterFilesForTopic(session), [session]);

  const [activePath, setActivePath] = useState('index.html');
  const [files, setFiles] = useState<WorkspaceFiles>(starterFiles);
  const [phase, setPhase] = useState<Phase>('practice');
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [selectedVerdict, setSelectedVerdict] = useState<'solid' | 'shaky' | 'stuck' | null>(null);

  const requirements = useMemo(() => requirementsFromContext(session), [session]);
  const state = useRequirements(files, requirements, { enabled: phase === 'practice' });

  const scope = useMemo(
    () => ({ kind: 'scenario' as const, id: `kube:${exchange.courseId}:${topic.id}`, variantId: 'practice' }),
    [exchange.courseId, topic.id],
  );

  const { satisfiedIds } = useBankedRequirements({
    requirements,
    results: state.results,
    scope,
    files,
    workspaceKey: `practical:${exchange.courseId}:${topic.id}`,
  });

  const handleChange = useCallback(
    (path: string, value: string) =>
      setFiles((current) => ({ ...current, [path]: value })),
    [],
  );

  const submitVerdict = async (verdict: 'solid' | 'shaky' | 'stuck') => {
    setPhase('submitting');
    setSelectedVerdict(verdict);
    setVerdictError(null);

    try {
      const res = await authedFetch('/api/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: exchange.courseId,
          topic: topic.id,
          verdict,
          evidence: `${satisfiedIds.size}/${requirements.length} requirements met`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to submit.' }));
        setVerdictError(data.error || 'Failed to submit verdict.');
        setPhase('practice');
        return;
      }

      const result: VerdictResponse = await res.json();
      setPhase('done');

      setTimeout(() => {
        window.location.assign(result.redirectUrl);
      }, 2000);
    } catch (err) {
      setVerdictError(err instanceof Error ? err.message : 'Network error.');
      setPhase('practice');
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <Link href="/" className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
            ByteLabs
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="text-muted">Practice</span>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="truncate text-ink">{topic.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs text-subtle">
            {satisfiedIds.size} of {requirements.length}
          </p>
          {context.returnUrl && (
            <a
              href={context.returnUrl}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
            >
              Back to Kube
            </a>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="bl-scroll w-[clamp(21rem,32%,28rem)] shrink-0 overflow-y-auto border-e border-line">
          <div className="px-7 py-9">
            <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
              {topic.weight} · Unit {topic.unit}
            </p>
            <h1 className="mt-2 text-[length:var(--bl-step-2)] font-semibold text-ink">
              {topic.title}
            </h1>

            {topic.whyItMatters && (
              <p className="mt-4 text-sm text-muted">{topic.whyItMatters}</p>
            )}

            {signals.reviewMisses > 0 || signals.mistakes > 0 ? (
              <div className="mt-4 rounded-lg border border-attention/30 bg-attention-soft/40 px-4 py-3">
                <p className="text-xs font-medium text-ink">Focus areas</p>
                <p className="mt-1 text-xs text-muted">
                  {signals.reviewMisses > 0 && `${signals.reviewMisses} review miss${signals.reviewMisses > 1 ? 'es' : ''}`}
                  {signals.reviewMisses > 0 && signals.mistakes > 0 && ' · '}
                  {signals.mistakes > 0 && `${signals.mistakes} mistake${signals.mistakes > 1 ? 's' : ''}`}
                </p>
              </div>
            ) : null}

            {conceptTells.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-xs tracking-[0.14em] text-subtle uppercase">
                  Key concepts
                </h2>
                <ul className="space-y-2">
                  {conceptTells.map((tell) => (
                    <li
                      key={tell.term}
                      className="rounded-lg border border-line bg-surface px-4 py-3"
                    >
                      <p className="text-sm font-medium text-ink">{tell.term}</p>
                      <p className="mt-0.5 text-xs text-muted">{tell.tell}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topic.recap.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-xs tracking-[0.14em] text-subtle uppercase">
                  Recap
                </h2>
                <ul className="list-disc space-y-1 ps-5 text-sm text-muted marker:text-subtle">
                  {topic.recap.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-9">
              <h2 className="mb-3 text-xs tracking-[0.14em] text-subtle uppercase">
                Requirements
              </h2>
              <RequirementList
                requirements={requirements}
                results={state.results}
                running={state.running}
              />

              {verdictError && (
                <p className="mt-4 rounded-lg border border-attention/40 bg-attention-soft/50 px-3 py-2.5 text-sm text-muted">
                  {verdictError}
                </p>
              )}

              <div className="mt-7">
                {phase === 'done' ? (
                  <div className="rounded-xl border border-success/30 bg-success-soft/40 px-5 py-4">
                    <p className="font-medium text-ink">Submitted!</p>
                    <p className="mt-1 text-sm text-muted">
                      Taking you back to Studying Kube...
                    </p>
                  </div>
                ) : phase === 'submitting' ? (
                  <div className="flex items-center gap-3 px-1">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-accent" />
                    <p className="text-sm text-muted">
                      Submitting your {selectedVerdict} verdict...
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-subtle">
                      How did this go? Your honest assessment helps us adapt.
                    </p>
                    <div className="flex gap-2">
                      {(['solid', 'shaky', 'stuck'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => void submitVerdict(v)}
                          disabled={phase !== 'practice'}
                          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                            v === 'solid'
                              ? 'bg-success/90 text-white hover:bg-success'
                              : v === 'shaky'
                                ? 'bg-attention/80 text-white hover:bg-attention'
                                : 'border border-line bg-surface text-muted hover:text-ink'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-subtle">
                      Nothing here is marked. Leave whenever you like — your work is kept.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col gap-3 p-4" aria-label="Editor and preview">
          <div className="flex min-h-0 flex-[3] flex-col">
            <Workspace
              files={files}
              activePath={activePath}
              onSelect={setActivePath}
              onChange={handleChange}
              readOnly={phase !== 'practice'}
            />
          </div>
          <div className="flex min-h-0 flex-[2] flex-col">
            <p className="mb-1.5 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              Preview
            </p>
            <Preview files={files} className="min-h-0 flex-1" />
          </div>
        </section>
      </div>

      <AssistPanel
        context={{
          zone: 'ground-assisted',
          title: `Practice: ${topic.title}`,
          files,
        }}
      />
    </div>
  );
}
