import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('auth/verify', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FIREBASE_PROJECT_ID = 'test-project';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('getAuthFromRequest returns null without Authorization header', async () => {
    const { getAuthFromRequest } = await import('@/lib/auth/verify');
    const req = new Request('http://localhost', { headers: {} });
    const result = await getAuthFromRequest(req);
    expect(result).toBeNull();
  });

  it('getAuthFromRequest returns null with malformed header', async () => {
    const { getAuthFromRequest } = await import('@/lib/auth/verify');
    const req = new Request('http://localhost', {
      headers: { Authorization: 'NotBearer token' },
    });
    const result = await getAuthFromRequest(req);
    expect(result).toBeNull();
  });

  it('requireAuth returns 401 response when not signed in', async () => {
    const { requireAuth } = await import('@/lib/auth/verify');
    const req = new Request('http://localhost');
    const result = await requireAuth(req);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns null when FIREBASE_PROJECT_ID is not set', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const { verifyIdToken } = await import('@/lib/auth/verify');
    const result = await verifyIdToken('any-token');
    expect(result).toBeNull();
  });
});
