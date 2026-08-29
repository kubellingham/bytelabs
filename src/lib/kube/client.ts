import type {
  ExchangeResult,
  TopicContext,
  VerdictPayload,
  VerdictResponse,
  KubeEntitlement,
} from './types';

function kubeUrl(): string {
  return process.env.KUBE_API_URL || 'https://studying-kube.vercel.app';
}

type KubeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

async function kubeRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    bearerToken?: string;
  } = {},
): Promise<KubeResult<T>> {
  try {
    const { method = 'GET', body, bearerToken } = options;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const res = await fetch(`${kubeUrl()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      let error: string;
      try {
        error = JSON.parse(text).error || text;
      } catch {
        error = text;
      }
      return { ok: false, error, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Step 1: Exchange a handoff code for an idToken + course/topic IDs.
 * The code is single-use, 60-second TTL.
 */
export async function exchangeHandoffCode(
  code: string,
): Promise<KubeResult<ExchangeResult>> {
  return kubeRequest<ExchangeResult>('/api/handoff/exchange', {
    method: 'POST',
    body: { code },
  });
}

/**
 * Step 2: Fetch the full topic context using the idToken from the exchange.
 */
export async function fetchTopicContext(
  courseId: string,
  topicId: string,
  bearerToken: string,
): Promise<KubeResult<TopicContext>> {
  return kubeRequest<TopicContext>(
    `/api/bytelabs/topic?course=${encodeURIComponent(courseId)}&topic=${encodeURIComponent(topicId)}`,
    { bearerToken },
  );
}

/**
 * Step 3: Check entitlement — POST, not GET.
 */
export async function checkEntitlement(
  bearerToken: string,
): Promise<KubeResult<KubeEntitlement>> {
  return kubeRequest<KubeEntitlement>('/api/entitlement/introspect', {
    method: 'POST',
    bearerToken,
  });
}

/**
 * Step 4: Post a verdict back to Kube after practice.
 * The response includes a redirectUrl to send the learner back.
 */
export async function postVerdict(
  payload: VerdictPayload,
  bearerToken: string,
): Promise<KubeResult<VerdictResponse>> {
  return kubeRequest<VerdictResponse>('/api/bytelabs/verdict', {
    method: 'POST',
    body: payload,
    bearerToken,
  });
}
