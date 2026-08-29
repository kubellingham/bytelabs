import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Kube client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.KUBE_API_URL = 'https://test-kube.example.com';
    process.env.KUBE_SHARED_SECRET = 'test-secret-256bit-hex-value';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('exchangeHandoffCode sends code and shared secret', async () => {
    const mockResponse = {
      courseId: 'int42d',
      courseCode: 'INT42D',
      courseTitle: 'Internet and Web Technologies',
      topicId: 'u4-html-tables',
      topicTitle: 'HTML Tables',
      unit: 4,
      recap: ['Tables use <table>'],
      whyItMatters: 'Tables matter',
      deps: [],
      practiceShape: 'editor-gym' as const,
      uid: 'test-uid',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    );

    const { exchangeHandoffCode } = await import('@/lib/kube/client');
    const result = await exchangeHandoffCode('test-code-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.courseId).toBe('int42d');
      expect(result.data.topicId).toBe('u4-html-tables');
      expect(result.data.practiceShape).toBe('editor-gym');
    }

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://test-kube.example.com/api/bytelabs/exchange');
    expect(opts?.method).toBe('POST');
    const headers = opts?.headers as Record<string, string>;
    expect(headers['X-ByteLabs-Secret']).toBe('test-secret-256bit-hex-value');
    expect(JSON.parse(opts?.body as string)).toEqual({ code: 'test-code-123' });
  });

  it('postVerdict sends verdict with bearer token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ received: true }), { status: 200 }),
    );

    const { postVerdict } = await import('@/lib/kube/client');
    const verdict = {
      courseId: 'int42d',
      topicId: 'u4-html-tables',
      uid: 'test-uid',
      result: 'solid' as const,
      concepts: [
        { conceptId: 'table-structure', label: 'Table structure', result: 'solid' as const },
      ],
      durationSeconds: 300,
      attempts: 1,
      timestamp: '2026-08-29T14:00:00Z',
    };

    const result = await postVerdict(verdict, 'fake-bearer-token');
    expect(result.ok).toBe(true);

    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://test-kube.example.com/api/bytelabs/verdict');
    const headers = opts?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer fake-bearer-token');
    expect(headers['X-ByteLabs-Secret']).toBe('test-secret-256bit-hex-value');
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

  it('returns error when KUBE_SHARED_SECRET is missing', async () => {
    delete process.env.KUBE_SHARED_SECRET;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    );

    const { exchangeHandoffCode } = await import('@/lib/kube/client');
    const result = await exchangeHandoffCode('any-code');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('KUBE_SHARED_SECRET');
    }
  });

  it('checkEntitlement returns tier info', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ tier: 'summit', source: 'stripe', expiresAt: null }), {
        status: 200,
      }),
    );

    const { checkEntitlement } = await import('@/lib/kube/client');
    const result = await checkEntitlement('fake-token');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tier).toBe('summit');
      expect(result.data.source).toBe('stripe');
    }
  });
});
