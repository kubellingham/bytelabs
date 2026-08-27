'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { AssistContext, AssistErrorBody } from '@/lib/assist/types';

/**
 * The assistant, as the brief describes it: a senior developer sitting in the same
 * room. You do not have to talk to them. The moment you turn and ask, they answer.
 *
 * What this component deliberately does not do — every one of these is specified:
 * no popups, no unsolicited suggestions, no "did you mean to write that?", and it
 * never interrupts a session. It is one button, always in the same place, and it
 * does nothing at all until it is clicked.
 */
export function AssistPanel({ context }: { context: AssistContext }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'asking' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Closing mid-answer stops the stream rather than paying for the rest of it.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  const ask = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || status === 'asking') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('asking');
    setAnswer('');
    setError(null);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, question: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as AssistErrorBody | null;
        setError(body?.message ?? 'The assistant could not be reached.');
        setStatus('error');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('The assistant sent nothing back.');
        setStatus('error');
        return;
      }

      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnswer(text);
      }
      setStatus('idle');
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [context, question, status]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="fixed end-6 bottom-6 z-50 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted shadow-md transition-colors hover:border-accent/50 hover:text-ink"
      >
        <span aria-hidden="true" className="text-accent">
          ?
        </span>
        Ask
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Ask the assistant"
          className="fixed end-6 bottom-20 z-50 flex max-h-[min(32rem,70dvh)] w-[min(28rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Ask</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-sm text-subtle transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>

          <div className="bl-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {error ? (
              <p className="rounded-lg border border-attention/40 bg-attention-soft/50 px-3 py-2.5 text-sm text-muted">
                {error}
              </p>
            ) : answer ? (
              <div className="text-sm whitespace-pre-wrap text-muted">{answer}</div>
            ) : status === 'asking' ? (
              <p className="text-sm text-subtle">Thinking…</p>
            ) : (
              <p className="text-sm text-subtle">
                Stuck on something? Ask it here. Nothing is sent until you do.
              </p>
            )}
          </div>

          <form
            className="shrink-0 border-t border-line p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask();
            }}
          >
            <textarea
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void ask();
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder="Why isn't my stylesheet applying?"
              aria-label="Your question"
              className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-subtle focus-visible:border-accent"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-subtle">Enter to send</p>
              <button
                type="submit"
                disabled={status === 'asking' || question.trim().length === 0}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
              >
                Ask
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
