import { type NextRequest, NextResponse } from 'next/server';
import { exchangeHandoffCode, fetchTopicContext } from '@/lib/kube/client';

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

  // Step 1: exchange the code for idToken + course/topic IDs
  const exchange = await exchangeHandoffCode(code);
  if (!exchange.ok) {
    const status = exchange.status === 0 ? 502 : exchange.status;
    return NextResponse.json({ error: exchange.error }, { status });
  }

  const { idToken, courseId, topicId } = exchange.data;

  // Step 2: fetch full topic context using the idToken
  const topic = await fetchTopicContext(courseId, topicId, idToken);
  if (!topic.ok) {
    const status = topic.status === 0 ? 502 : topic.status;
    return NextResponse.json({ error: topic.error }, { status });
  }

  // Return both exchange data and topic context to the client
  return NextResponse.json({
    exchange: exchange.data,
    context: topic.data,
  });
}
