/**
 * Integration types for the ByteLabs ↔ Studying Kube boundary.
 *
 * Shapes match Kube's actual API responses on
 * branch `claude/bytelabs-studying-kube-integration-4obfax`.
 */

/** Step 1 — Exchange response from POST /api/handoff/exchange */
export interface ExchangeResult {
  idToken: string;
  uid: string;
  email: string;
  courseId: string;
  topicId: string;
  mode: 'practice';
}

/** A concept tell from Kube — term + short explanation for the practice UI. */
export interface ConceptTell {
  term: string;
  tell: string;
}

/** Learner signals Kube sends about the topic — where they're struggling. */
export interface LearnerSignals {
  reviewMisses: number;
  mistakes: number;
  flags: string[];
}

/** Kube's topic shape (subset relevant to ByteLabs). */
export interface KubeTopic {
  id: string;
  title: string;
  unit: number;
  weight: 'heavy' | 'medium' | 'light';
  whyItMatters: string;
  recap: string[];
  deps: string[];
}

/** Step 2 — Topic context from GET /api/bytelabs/topic */
export interface TopicContext {
  topic: KubeTopic;
  signals: LearnerSignals;
  mode: 'practice';
  conceptTells: ConceptTell[];
  returnUrl: string;
}

/** The full handoff state ByteLabs stores after exchange + topic fetch. */
export interface HandoffSession {
  exchange: ExchangeResult;
  context: TopicContext;
}

/** Step 3 — Entitlement from POST /api/entitlement/introspect */
export interface KubeEntitlement {
  entitled: boolean;
  tier: 'climb' | 'summit' | 'crew' | null;
}

/** Step 4 — Verdict request body for POST /api/bytelabs/verdict */
export interface VerdictPayload {
  course: string;
  topic: string;
  verdict: 'solid' | 'shaky' | 'stuck';
  evidence?: string;
  concepts?: Record<string, unknown>;
  artifact?: Record<string, unknown>;
  outOfBand?: boolean;
  windowId?: string;
  attemptId?: string;
}

/** Step 4 — Verdict response from Kube */
export interface VerdictResponse {
  acknowledged: boolean;
  kubeAction: 'advance-topic' | 'flag-topic' | 're-open-topic';
  redirectUrl: string;
}
