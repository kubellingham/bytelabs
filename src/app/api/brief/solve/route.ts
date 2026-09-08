import { solveTask } from '@/lib/brief/solve';
import { briefTaskSchema } from '@/lib/brief/types';

export const runtime = 'nodejs';

/**
 * POST /api/brief/solve — turn a BriefTask into an AI walkthrough.
 *
 * Stateless. The client caches the response per task in localStorage so a
 * re-open of the same task's walkthrough is instant and credit-free.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'That request could not be read.' }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const parsed = briefTaskSchema.safeParse(body.task);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid-task', message: 'The `task` field was missing or malformed.' },
      { status: 400 },
    );
  }

  const result = await solveTask(parsed.data);
  if (!result.ok) {
    const status =
      result.failure.error === 'not-configured'
        ? 503
        : result.failure.error === 'no-solution'
          ? 502
          : 502;
    return Response.json(
      { error: result.failure.error, message: result.failure.message },
      { status },
    );
  }

  return Response.json(result.data);
}
