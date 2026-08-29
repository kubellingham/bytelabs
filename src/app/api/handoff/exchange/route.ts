import { type NextRequest, NextResponse } from 'next/server';
import { exchangeHandoffCode } from '@/lib/kube/client';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { code } = body;
  if (typeof code !== 'string' || !code) {
    return NextResponse.json({ error: 'Missing exchange code.' }, { status: 400 });
  }

  const result = await exchangeHandoffCode(code);
  if (!result.ok) {
    const status = result.status === 0 ? 502 : result.status;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
