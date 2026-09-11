import { parseBrief } from '@/lib/brief/parse';

export const runtime = 'nodejs';

/**
 * POST /api/brief — parse a paste into tasks.
 *
 * Stateless: the client stores the returned session in localStorage. There is
 * no auth requirement, no rate limiting yet (fair for the MVP; ANTHROPIC_API_KEY
 * is the natural throttle), and no persistence — a session that never gets
 * saved on the client is simply forgotten.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'That request could not be read.' }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const paste = typeof body.paste === 'string' ? body.paste : '';

  const result = await parseBrief(paste);
  if (!result.ok) {
    const failure = result.failure;
    const status =
      failure.error === 'not-configured'
        ? 503
        : failure.error === 'empty' || failure.error === 'too-large' || failure.error === 'no-tasks'
          ? 400
          : 502;
    return Response.json({ error: failure.error, message: failure.message }, { status });
  }

  return Response.json({
    sourceLabel: result.data.sourceLabel,
    tasks: result.data.tasks,
  });
}
