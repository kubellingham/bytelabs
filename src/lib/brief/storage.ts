'use client';

import { briefSessionSchema, type BriefSession } from './types';

/**
 * Client-side brief session storage.
 *
 * A brief session lives in localStorage for 24 hours. This is deliberately
 * anonymous — the standalone-facing pillar of ByteLabs is "bring a task, leave
 * with the code", and the whole point is that a stranger off the street can
 * paste and go without signing in. Firestore-backed persistence is a later
 * layer for people who want receipts across devices.
 */

const KEY_PREFIX = 'bytelabs.brief.v1.';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const INDEX_KEY = 'bytelabs.brief.v1.index';

interface StoredEnvelope {
  session: BriefSession;
  expiresAt: number;
}

function keyFor(sessionId: string): string {
  return KEY_PREFIX + sessionId;
}

export function saveSession(session: BriefSession): void {
  if (typeof window === 'undefined') return;
  const envelope: StoredEnvelope = {
    session,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  try {
    window.localStorage.setItem(keyFor(session.id), JSON.stringify(envelope));
    touchIndex(session.id);
  } catch {
    /* Storage full or unavailable; the session is just not remembered on refresh. */
  }
}

export function loadSession(sessionId: string): BriefSession | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(keyFor(sessionId));
  } catch {
    return null;
  }
  if (!raw) return null;
  let envelope: StoredEnvelope;
  try {
    envelope = JSON.parse(raw) as StoredEnvelope;
  } catch {
    return null;
  }
  if (envelope.expiresAt < Date.now()) {
    try {
      window.localStorage.removeItem(keyFor(sessionId));
    } catch {
      /* ignore */
    }
    return null;
  }
  const parsed = briefSessionSchema.safeParse(envelope.session);
  return parsed.success ? parsed.data : null;
}

/** Per-task workspace, so the learner's code survives a refresh mid-task. */
export function saveWorkspace(sessionId: string, taskId: string, files: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${KEY_PREFIX}${sessionId}.workspace.${taskId}`,
      JSON.stringify(files),
    );
  } catch {
    /* ignore */
  }
}

export function loadWorkspace(sessionId: string, taskId: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${sessionId}.workspace.${taskId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * A tiny index of known session ids and when they were last touched, so the
 * `/brief` landing page can show "your recent briefs" without walking the whole
 * localStorage keyspace.
 */
export interface BriefIndexEntry {
  id: string;
  sourceLabel: string;
  taskCount: number;
  updatedAt: number;
}

function readIndex(): BriefIndexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BriefIndexEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: BriefIndexEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function touchIndex(sessionId: string): void {
  const session = loadSession(sessionId);
  if (!session) return;
  const entries = readIndex().filter((entry) => entry.id !== sessionId);
  entries.unshift({
    id: session.id,
    sourceLabel: session.sourceLabel,
    taskCount: session.tasks.length,
    updatedAt: Date.now(),
  });
  writeIndex(entries.slice(0, 8));
}

export function recentSessions(): BriefIndexEntry[] {
  return readIndex()
    .filter((entry) => loadSession(entry.id) !== null)
    .slice(0, 8);
}

export function newSessionId(): string {
  const rand = new Uint8Array(9);
  crypto.getRandomValues(rand);
  return Array.from(rand, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 12);
}
