import {
  createLearnerState,
  STATE_VERSION,
  type LearnerState,
  type ProgressStore,
} from './types';

export const PROGRESS_STORAGE_KEY = 'bytelabs.progress.v1';

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/**
 * Keyed by the version being migrated *from*. Empty today, but the versioned read
 * path exists from the first commit so a schema change never costs learners their
 * history — they have no account to restore it from.
 */
const MIGRATIONS: Record<number, Migration> = {};

function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  let state = raw;
  let version = typeof state.version === 'number' ? state.version : 0;

  while (version < STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    state = step(state);
    version += 1;
    state.version = version;
  }
  return state;
}

/**
 * Fills in anything a stored snapshot is missing. Cheaper and far less brittle
 * than validating the whole tree on every boot, and it means a partially-written
 * record degrades to a working one instead of throwing the learner back to zero.
 */
function hydrate(raw: unknown): LearnerState {
  const base = createLearnerState();
  if (typeof raw !== 'object' || raw === null) return base;

  const stored = migrate(raw as Record<string, unknown>);
  const record = <T,>(value: unknown): Record<string, T> =>
    typeof value === 'object' && value !== null ? (value as Record<string, T>) : {};

  return {
    ...base,
    ...stored,
    version: STATE_VERSION,
    createdAt: typeof stored.createdAt === 'string' ? stored.createdAt : base.createdAt,
    lastActiveAt:
      typeof stored.lastActiveAt === 'string' ? stored.lastActiveAt : base.lastActiveAt,
    lessons: record(stored.lessons),
    units: record(stored.units),
    concepts: record(stored.concepts),
    scenarios: record(stored.scenarios),
    workspaces: record(stored.workspaces),
    xp: record(stored.xp),
    streak: { ...base.streak, ...record<never>(stored.streak) },
    warmup: { ...base.warmup, ...record<never>(stored.warmup) },
    scheduled: record(stored.scheduled),
  } as LearnerState;
}

/**
 * Local-first progress. Writes are debounced because the ghost engine updates
 * mastery on practically every resolved line, and serialising the whole tree on
 * each keystroke would be felt in the editor.
 */
export class LocalProgressStore implements ProgressStore {
  private state: LearnerState;
  private readonly listeners = new Set<() => void>();
  private flushHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storage: Storage | null = typeof window === 'undefined'
      ? null
      : window.localStorage,
    private readonly key: string = PROGRESS_STORAGE_KEY,
    private readonly writeDelayMs = 250,
  ) {
    this.state = this.read();
  }

  private read(): LearnerState {
    if (!this.storage) return createLearnerState();
    try {
      const raw = this.storage.getItem(this.key);
      return raw ? hydrate(JSON.parse(raw)) : createLearnerState();
    } catch {
      return createLearnerState();
    }
  }

  getSnapshot(): LearnerState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  update(recipe: (state: LearnerState) => LearnerState): void {
    const next = recipe(this.state);
    if (next === this.state) return;
    this.state = next;
    this.scheduleFlush();
    for (const listener of this.listeners) listener();
  }

  reset(): void {
    this.state = createLearnerState();
    this.flush();
    for (const listener of this.listeners) listener();
  }

  private scheduleFlush(): void {
    if (!this.storage) return;
    if (this.flushHandle !== null) clearTimeout(this.flushHandle);
    this.flushHandle = setTimeout(() => this.flush(), this.writeDelayMs);
  }

  flush(): void {
    if (this.flushHandle !== null) {
      clearTimeout(this.flushHandle);
      this.flushHandle = null;
    }
    if (!this.storage) return;
    try {
      this.storage.setItem(this.key, JSON.stringify(this.state));
    } catch {
      // Quota or a locked-down browser. The session keeps working in memory;
      // losing progress silently beats breaking the lesson the learner is in.
    }
  }
}

/**
 * In-memory store for tests, SSR, and any browser that refuses storage entirely.
 */
export class MemoryProgressStore extends LocalProgressStore {
  constructor() {
    super(null);
  }
}

let singleton: LocalProgressStore | null = null;

export function getProgressStore(): LocalProgressStore {
  if (!singleton) {
    singleton = new LocalProgressStore();
    if (typeof window !== 'undefined') {
      // A refresh mid-lesson should not lose the last debounce window.
      window.addEventListener('pagehide', () => singleton?.flush());
    }
  }
  return singleton;
}
