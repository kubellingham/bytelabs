import Anthropic from '@anthropic-ai/sdk';

import { buildSystemPrompt, buildUserMessage } from '@/lib/assist/prompt';
import { isAssistZone, type AssistErrorBody } from '@/lib/assist/types';

export const runtime = 'nodejs';

/**
 * Claude Opus 5. Overridable for anyone running their own deployment on a
 * different model, but not downgraded by default — the assistant is answering
 * questions about a learner's own broken code, which is not an easy task.
 */
const MODEL = process.env.BYTELABS_ASSIST_MODEL ?? 'claude-opus-5';

const MAX_QUESTION_CHARS = 1000;

function fail(status: number, body: AssistErrorBody): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Without a key the assistant says so plainly rather than erroring. Everything
  // else in ByteLabs works without one, and a broken panel would imply otherwise.
  if (!apiKey) {
    return fail(503, {
      error: 'not-configured',
      message:
        'The assistant is not switched on for this deployment. Set ANTHROPIC_API_KEY to enable it — everything else works without it.',
    });
  }

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

  const client = new Anthropic({ apiKey });

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

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 1500,
      // Low effort: these are short, direct answers about code already on screen,
      // not problems that repay deep deliberation. Thinking stays on — disabling it
      // on Opus 5 can leak reasoning into the visible reply.
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      system: buildSystemPrompt(zone),
      messages: [{ role: 'user', content: buildUserMessage(context, question) }],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const final = await stream.finalMessage();
          if (final.stop_reason === 'refusal') {
            controller.enqueue(
              encoder.encode('\n\nI am not able to answer that one. Try rephrasing it.'),
            );
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `\n\n[The answer stopped early: ${
                error instanceof Error ? error.message : 'connection lost'
              }]`,
            ),
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        // The learner closed the panel mid-answer; stop paying for the rest of it.
        stream.abort();
      },
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail(429, {
        error: 'rate-limited',
        message: 'Too many questions at once. Give it a moment.',
      });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return fail(503, {
        error: 'not-configured',
        message: 'The configured API key was rejected.',
      });
    }
    return fail(502, {
      error: 'failed',
      message: error instanceof Error ? error.message : 'The assistant could not be reached.',
    });
  }
}
