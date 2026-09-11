'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { newSessionId, saveSession } from '@/lib/brief/storage';
import type { BriefSession } from '@/lib/brief/types';

const PLACEHOLDER = `Paste a syllabus, a practical sheet, or a list of "write a program that…" prompts.

Example:
  Practical 5 — Write a Python program that accepts a list of numbers
  and prints the maximum, the minimum, and how many times the value 88
  appears. Use: scores = [45, 88, 72, 91, 60, 88, 100]`;

export function BriefPasteForm() {
  const router = useRouter();
  const [paste, setPaste] = useState('');
  const [state, setState] = useState<'idle' | 'parsing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'parsing') return;
    if (!paste.trim()) return;

    setState('parsing');
    setError(null);

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paste }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Parsing failed.' }));
        setState('error');
        setError(typeof data.message === 'string' ? data.message : 'Parsing failed.');
        return;
      }

      const { sourceLabel, tasks } = (await res.json()) as {
        sourceLabel: string;
        tasks: BriefSession['tasks'];
      };

      const session: BriefSession = {
        id: newSessionId(),
        sourceLabel,
        createdAt: Date.now(),
        tasks,
      };
      saveSession(session);
      router.push(`/brief/${session.id}/0`);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }

  const disabled = state === 'parsing' || paste.trim().length === 0;

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <label htmlFor="brief-paste" className="sr-only">
        Paste your brief
      </label>
      <textarea
        id="brief-paste"
        value={paste}
        onChange={(event) => setPaste(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={14}
        className="w-full resize-y rounded-xl border border-line bg-surface p-5 font-mono text-sm leading-relaxed text-ink shadow-sm outline-none placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
        disabled={state === 'parsing'}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-subtle">
          {paste.length.toLocaleString()} character{paste.length === 1 ? '' : 's'}. Stays in your browser
          for 24 hours.
        </p>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-subtle"
        >
          {state === 'parsing' ? 'Parsing…' : 'Get the room'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft/40 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
    </form>
  );
}
