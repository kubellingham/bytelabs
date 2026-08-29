import { type NextRequest, NextResponse } from 'next/server';
import { postVerdict } from '@/lib/kube/client';
import type { VerdictPayload } from '@/lib/kube/types';

export async function POST(req: NextRequest) {
  const bearerToken = (req.headers.get('authorization') || '').replace(/^Bearer /i, '');
  if (!bearerToken) {
    return NextResponse.json({ error: 'Missing authorization.' }, { status: 401 });
  }

  let body: VerdictPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body.course || !body.topic || !body.verdict) {
    return NextResponse.json(
      { error: 'Missing required fields: course, topic, verdict.' },
      { status: 400 },
    );
  }

  if (!['solid', 'shaky', 'stuck'].includes(body.verdict)) {
    return NextResponse.json(
      { error: 'verdict must be solid, shaky, or stuck.' },
      { status: 400 },
    );
  }

  const result = await postVerdict(body, bearerToken);

  if (!result.ok) {
    if (result.status === 0) {
      return NextResponse.json(
        { error: 'Could not reach Studying Kube.', detail: result.error },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
