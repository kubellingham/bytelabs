import Anthropic from '@anthropic-ai/sdk';

import { resolveProvider, type ResolvedProvider } from './provider';

/**
 * Single-shot text completion, provider-agnostic.
 *
 * Anthropic native goes through the SDK; OpenRouter goes through its
 * OpenAI-compatible chat/completions endpoint via plain fetch. Both return
 * concatenated text so the caller — parse.ts today, anyone else tomorrow —
 * doesn't have to care which provider answered.
 */

export interface CompleteRequest {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
}

export type CompleteResult =
  | { ok: true; text: string; provider: ResolvedProvider['provider'] }
  | {
      ok: false;
      error: 'not-configured' | 'auth' | 'rate-limited' | 'failed';
      message: string;
    };

export async function complete(request: CompleteRequest): Promise<CompleteResult> {
  const provider = resolveProvider();
  if (provider.provider === 'none' || !provider.apiKey) {
    return {
      ok: false,
      error: 'not-configured',
      message:
        'Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY on this deployment to switch it on.',
    };
  }

  if (provider.provider === 'anthropic') {
    return callAnthropic(provider.apiKey, request);
  }
  return callOpenRouter(provider.apiKey, request);
}

async function callAnthropic(apiKey: string, request: CompleteRequest): Promise<CompleteResult> {
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    });
    let text = '';
    for (const block of message.content) {
      if (block.type === 'text') text += block.text;
    }
    return { ok: true, text, provider: 'anthropic' };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: 'rate-limited', message: 'The model is rate-limited right now.' };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: 'auth', message: 'The Anthropic key was rejected.' };
    }
    return {
      ok: false,
      error: 'failed',
      message: error instanceof Error ? error.message : 'The model could not be reached.',
    };
  }
}

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message?: string };
}

async function callOpenRouter(apiKey: string, request: CompleteRequest): Promise<CompleteResult> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter surfaces these on their analytics; harmless and honest.
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://bytelabs-rosy.vercel.app',
        'X-Title': 'ByteLabs',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
      }),
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: 'auth', message: 'The OpenRouter key was rejected.' };
    }
    if (response.status === 429) {
      return { ok: false, error: 'rate-limited', message: 'OpenRouter rate-limited the request.' };
    }
    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      return {
        ok: false,
        error: 'failed',
        message: `OpenRouter returned ${response.status}${bodyText ? ` — ${bodyText.slice(0, 200)}` : ''}`,
      };
    }

    const data = (await response.json()) as OpenRouterResponse;
    if (data.error?.message) {
      return { ok: false, error: 'failed', message: data.error.message };
    }
    const text = data.choices?.[0]?.message?.content ?? '';
    return { ok: true, text, provider: 'openrouter' };
  } catch (error) {
    return {
      ok: false,
      error: 'failed',
      message: error instanceof Error ? error.message : 'OpenRouter could not be reached.',
    };
  }
}
