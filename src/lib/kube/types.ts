/**
 * Integration types for the ByteLabs ↔ Studying Kube boundary.
 *
 * Topic is the atomic handoff unit. Kube says "practise this topic";
 * ByteLabs turns it into a workspace and sends back a verdict.
 */

/** What Kube sends when it hands off a topic for practice. */
export interface HandoffPayload {
  /** The exchange code Kube generated — single-use, short-lived. */
  code: string;
}

/** What ByteLabs gets back after exchanging the code with Kube. */
export interface TopicContext {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  topicId: string;
  topicTitle: string;
  unit: number;
  /** The topic's key facts — drives ghost text and hints. */
  recap: string[];
  /** Why this topic matters — shown as context in the workspace. */
  whyItMatters: string;
  /** Prerequisite topic IDs the learner should already know. */
  deps: string[];
  /** What shape of practice ByteLabs should generate. */
  practiceShape: PracticeShape;
  /** The learner's uid (verified by Kube on the exchange). */
  uid: string;
}

export type PracticeShape = 'editor-gym' | 'runnable-code' | 'numerical-workbench';

/** What ByteLabs sends back to Kube after practice. */
export interface Verdict {
  courseId: string;
  topicId: string;
  uid: string;
  /** Overall assessment. */
  result: 'solid' | 'shaky' | 'stuck';
  /** Per-concept breakdown — concepts the topic teaches. */
  concepts: ConceptVerdict[];
  /** How long the practice session lasted, in seconds. */
  durationSeconds: number;
  /** How many attempts the learner made. */
  attempts: number;
  /** ISO timestamp when the verdict was produced. */
  timestamp: string;
}

export interface ConceptVerdict {
  conceptId: string;
  label: string;
  result: 'solid' | 'shaky' | 'stuck';
  /** Specific hint for this concept if the learner struggled. */
  hint?: string;
}

/** Kube's entitlement response. */
export interface KubeEntitlement {
  tier: 'climb' | 'summit' | 'crew' | null;
  source: 'promo' | 'stripe' | 'crew' | null;
  expiresAt: number | null;
}

/** Errors returned by the Kube API. */
export interface KubeApiError {
  error: string;
  status: number;
}
