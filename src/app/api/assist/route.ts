import { openStream } from '@/lib/ai/stream';
import { resolveModel, resolveProvider } from '@/lib/ai/provider';
import { buildSystemPrompt, buildUserMessage } from '@/lib/assist/prompt';
import { isAssistZone, type AssistErrorBody } from '@/lib/assist/types';

export const runtime = 'nodejs';

const MAX_QUESTION_CHARS = 1000;

function fail(status: number, body: AssistErrorBody): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, { error: 'failed', message: 'That request could not be read.' });
  }

  const body = payload as Record<string, unknown>;
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const zone = body.zone;

  if (!question) {
    return fail(400, { error: 'failed', message: 'There was no question in that.' });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return fail(400, {
      error: 'failed',
      message: `Questions are capped at ${MAX_QUESTION_CHARS} characters.`,
    });
  }
  if (!isAssistZone(zone)) {
    return fail(400, { error: 'failed', message: 'Unknown zone.' });
  }

  const files =
    typeof body.files === 'object' && body.files !== null
      ? (body.files as Record<string, string>)
      : undefined;

  const context = {
    zone,
    ...(typeof body.title === 'string' ? { title: body.title } : {}),
    ...(typeof body.concept === 'string' ? { concept: body.concept } : {}),
    ...(files ? { files } : {}),
  };

  const provider = resolveProvider();
  const opened = openStream({
    system: buildSystemPrompt(zone),
    user: buildUserMessage(context, question),
    model: resolveModel('assist', provider.provider),
    maxTokens: 1500,
    // Only used on Anthropic — same fallback the assist route used before.
    anthropicFallbackModel: 'claude-opus-4-8',
  });

  if (!opened.ok) {
    if (opened.error === 'not-configured') {
      return fail(503, { error: 'not-configured', message: opened.message });
    }
    if (opened.error === 'auth') {
      return fail(503, { error: 'not-configured', message: opened.message });
    }
    return fail(502, { error: 'failed', message: opened.message });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of opened.handle.events) {
          if (event.kind === 'delta') {
            controller.enqueue(encoder.encode(event.text));
            continue;
          }
          if (event.stopReason === 'refusal') {
            controller.enqueue(
              encoder.encode('\n\nI am not able to answer that one. Try rephrasing it.'),
            );
          } else if (event.stopReason === 'error') {
            controller.enqueue(
              encoder.encode(
                `\n\n[The answer stopped early: ${event.message ?? 'connection lost'}]`,
              ),
            );
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Learner closed the panel mid-answer; stop paying for the rest.
      opened.handle.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
