import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/verify';
import { postVerdict } from '@/lib/kube/client';
import type { Verdict } from '@/lib/kube/types';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  let body: Verdict;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body.courseId || !body.topicId || !body.result) {
    return NextResponse.json(
      { error: 'Missing required fields: courseId, topicId, result.' },
      { status: 400 },
    );
  }

  if (!['solid', 'shaky', 'stuck'].includes(body.result)) {
    return NextResponse.json(
      { error: 'result must be solid, shaky, or stuck.' },
      { status: 400 },
    );
  }

  // Forward the learner's Firebase token to Kube so Kube can verify identity
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /i, '');

  const result = await postVerdict(
    { ...body, uid: authResult.auth.uid, timestamp: new Date().toISOString() },
    token,
  );

  if (!result.ok) {
    if (result.status === 0) {
      return NextResponse.json(
        { error: 'Could not reach Studying Kube.', detail: result.error },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ received: true });
}
