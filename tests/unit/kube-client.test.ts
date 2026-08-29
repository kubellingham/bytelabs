import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Kube client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.KUBE_API_URL = 'https://test-kube.example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('exchangeHandoffCode sends code to /api/handoff/exchange', async () => {
    const mockResponse = {
      idToken: 'firebase-id-token',
      uid: 'test-uid',
      email: 'test@example.com',
      courseId: 'int42d',
      topicId: 'u4-html-tables',
      mode: 'practice',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const { exchangeHandoffCode } = await import('@/lib/kube/client');
    const result = await exchangeHandoffCode('test-code-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.idToken).toBe('firebase-id-token');
      expect(result.data.courseId).toBe('int42d');
      expect(result.data.topicId).toBe('u4-html-tables');
      expect(result.data.mode).toBe('practice');
    }

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://test-kube.example.com/api/handoff/exchange');
    expect(opts?.method).toBe('POST');
    expect(JSON.parse(opts?.body as string)).toEqual({ code: 'test-code-123' });
  });

  it('postVerdict sends verdict with bearer token', async () => {
    const mockResponse = {
      acknowledged: true,
      kubeAction: 'advance-topic',
      redirectUrl: 'https://studying-kube.vercel.app/course/int42d',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const { postVerdict } = await import('@/lib/kube/client');
    const verdict = {
      course: 'int42d',
      topic: 'u4-html-tables',
      verdict: 'solid' as const,
      evidence: '5/5 requirements met',
    };

    const result = await postVerdict(verdict, 'fake-bearer-token');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.acknowledged).toBe(true);
      expect(result.data.kubeAction).toBe('advance-topic');
      expect(result.data.redirectUrl).toContain('studying-kube');
    }

    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://test-kube.example.com/api/bytelabs/verdict');
    const headers = opts?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer fake-bearer-token');
  });

  it('returns error on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Code expired' }), { status: 410 }),
    );

    const { exchangeHandoffCode } = await import('@/lib/kube/client');
    const result = await exchangeHandoffCode('expired-code');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Code expired');
      expect(result.status).toBe(410);
    }
  });

  it('returns error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'));

    const { exchangeHandoffCode } = await import('@/lib/kube/client');
    const result = await exchangeHandoffCode('any-code');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Connection refused');
      expect(result.status).toBe(0);
    }
  });

  it('fetchTopicContext calls correct endpoint with bearer token', async () => {
    const mockContext = {
      topic: { id: 'u4-html-tables', title: 'HTML Tables', unit: 4, weight: 'medium', whyItMatters: 'Tables matter', recap: [], deps: [] },
      signals: { reviewMisses: 0, mistakes: 0, flags: [] },
      mode: 'practice',
      conceptTells: [{ term: 'table', tell: 'Use <table> for tabular data' }],
      returnUrl: 'https://studying-kube.vercel.app/course/int42d',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockContext), { status: 200 }),
    );

    const { fetchTopicContext } = await import('@/lib/kube/client');
    const result = await fetchTopicContext('int42d', 'u4-html-tables', 'fake-id-token');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.topic.title).toBe('HTML Tables');
      expect(result.data.conceptTells).toHaveLength(1);
      expect(result.data.returnUrl).toContain('studying-kube');
    }

    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://test-kube.example.com/api/bytelabs/topic?course=int42d&topic=u4-html-tables');
    const headers = opts?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer fake-id-token');
  });

  it('checkEntitlement returns tier info', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ entitled: true, tier: 'summit' }), {
        status: 200,
      }),
    );

    const { checkEntitlement } = await import('@/lib/kube/client');
    const result = await checkEntitlement('fake-token');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.entitled).toBe(true);
      expect(result.data.tier).toBe('summit');
    }
  });
});
