import type { TopicContext, Verdict, KubeEntitlement } from './types';

function kubeUrl(): string {
  return process.env.KUBE_API_URL || 'https://studying-kube.vercel.app';
}

function sharedSecret(): string {
  const secret = process.env.KUBE_SHARED_SECRET;
  if (!secret) throw new Error('KUBE_SHARED_SECRET is not configured');
  return secret;
}

async function kubeRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    bearerToken?: string;
  } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const { method = 'GET', body, bearerToken } = options;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-ByteLabs-Secret': sharedSecret(),
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
 * Exchange a handoff code for topic context.
 * Kube verifies the code, returns the topic to practise.
 */
export async function exchangeHandoffCode(
  code: string,
): Promise<{ ok: true; data: TopicContext } | { ok: false; error: string; status: number }> {
  return kubeRequest<TopicContext>('/api/bytelabs/exchange', {
    method: 'POST',
    body: { code },
  });
}

/**
 * Fetch topic context directly (for cases where ByteLabs already has the
 * user's token — e.g. the learner navigates to a topic from within ByteLabs).
 */
export async function fetchTopicContext(
  courseId: string,
  topicId: string,
  bearerToken: string,
): Promise<{ ok: true; data: TopicContext } | { ok: false; error: string; status: number }> {
  return kubeRequest<TopicContext>(
    `/api/bytelabs/topic?courseId=${encodeURIComponent(courseId)}&topicId=${encodeURIComponent(topicId)}`,
    { bearerToken },
  );
}

/**
 * Post a verdict back to Kube after practice.
 */
export async function postVerdict(
  verdict: Verdict,
  bearerToken: string,
): Promise<{ ok: true; data: { received: true } } | { ok: false; error: string; status: number }> {
  return kubeRequest<{ received: true }>('/api/bytelabs/verdict', {
    method: 'POST',
    body: verdict,
    bearerToken,
  });
}

/**
 * Check a user's entitlement on the Kube side.
 */
export async function checkEntitlement(
  bearerToken: string,
): Promise<{ ok: true; data: KubeEntitlement } | { ok: false; error: string; status: number }> {
  return kubeRequest<KubeEntitlement>('/api/entitlement/introspect', {
    bearerToken,
  });
}
