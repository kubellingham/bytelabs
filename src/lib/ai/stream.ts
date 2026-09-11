import Anthropic from '@anthropic-ai/sdk';

import { resolveProvider } from './provider';

/**
 * Streaming completion, provider-agnostic.
 *
 * Anthropic native goes through the SDK and keeps its enhancements (adaptive
 * thinking, server-side fallback, refusal-stop handling). OpenRouter goes
 * through OpenAI-compatible SSE and receives plain text deltas — the ByteLabs
 * assist panel degrades gracefully when the enhanced features aren't there.
 */

export interface StreamRequest {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
  /** Anthropic-native fallback model. Ignored on OpenRouter. */
  anthropicFallbackModel?: string;
}

export type StreamEvent =
  | { kind: 'delta'; text: string }
  | { kind: 'end'; stopReason: 'complete' | 'refusal' | 'error'; message?: string };

export type StreamHandle = {
  events: AsyncIterable<StreamEvent>;
  /** Cooperative cancel — the panel closed mid-answer, stop paying for the rest. */
  abort: () => void;
};

export type OpenStreamResult =
  | { ok: true; handle: StreamHandle; provider: 'anthropic' | 'openrouter' }
  | {
      ok: false;
      error: 'not-configured' | 'auth' | 'failed';
      message: string;
    };

export function openStream(request: StreamRequest): OpenStreamResult {
  const provider = resolveProvider();
  if (provider.provider === 'none' || !provider.apiKey) {
    return {
      ok: false,
      error: 'not-configured',
      message:
        'The assistant is not switched on for this deployment. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY to enable it — everything else works without it.',
    };
  }

  if (provider.provider === 'anthropic') {
    return { ok: true, provider: 'anthropic', handle: openAnthropic(provider.apiKey, request) };
  }
  return { ok: true, provider: 'openrouter', handle: openOpenRouter(provider.apiKey, request) };
}

function openAnthropic(apiKey: string, request: StreamRequest): StreamHandle {
  const client = new Anthropic({ apiKey });
  const stream = client.beta.messages.stream({
    model: request.model,
    max_tokens: request.maxTokens,
    // Low effort: short, direct answers about code already on screen — not
    // problems that repay deep deliberation. Thinking stays on: disabling
    // it can leak reasoning into the visible reply.
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-06-01'],
    ...(request.anthropicFallbackModel
      ? { fallbacks: [{ model: request.anthropicFallbackModel }] }
      : {}),
    system: request.system,
    messages: [{ role: 'user', content: request.user }],
  });

  async function* iterate(): AsyncIterable<StreamEvent> {
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { kind: 'delta', text: event.delta.text };
        }
      }
      const final = await stream.finalMessage();
      yield { kind: 'end', stopReason: final.stop_reason === 'refusal' ? 'refusal' : 'complete' };
    } catch (error) {
      yield {
        kind: 'end',
        stopReason: 'error',
        message: error instanceof Error ? error.message : 'connection lost',
      };
    }
  }

  return { events: iterate(), abort: () => stream.abort() };
}

/**
 * OpenAI-compatible Server-Sent Events, as OpenRouter serves them. Each frame
 * is `data: {json}\n\n`, terminated by `data: [DONE]`.
 */
function openOpenRouter(apiKey: string, request: StreamRequest): StreamHandle {
  const controller = new AbortController();

  async function* iterate(): AsyncIterable<StreamEvent> {
    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://bytelabs-rosy.vercel.app',
          'X-Title': 'ByteLabs',
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens,
          stream: true,
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
        }),
      });
    } catch (error) {
      yield {
        kind: 'end',
        stopReason: 'error',
        message: error instanceof Error ? error.message : 'OpenRouter could not be reached.',
      };
      return;
    }

    if (!response.ok || !response.body) {
      const bodyText = await response.text().catch(() => '');
      yield {
        kind: 'end',
        stopReason: 'error',
        message: `OpenRouter returned ${response.status}${bodyText ? ` — ${bodyText.slice(0, 200)}` : ''}`,
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const dataLines = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim());
          for (const payload of dataLines) {
            if (!payload || payload === '[DONE]') continue;
            try {
              const event = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const text = event.choices?.[0]?.delta?.content;
              if (text) yield { kind: 'delta', text };
            } catch {
              // OpenRouter sometimes sends heartbeat frames or comments —
              // ignore anything that isn't parseable JSON.
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      yield { kind: 'end', stopReason: 'complete' };
    } catch (error) {
      yield {
        kind: 'end',
        stopReason: 'error',
        message: error instanceof Error ? error.message : 'connection lost',
      };
    }
  }

  return { events: iterate(), abort: () => controller.abort() };
}
