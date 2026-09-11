import { complete } from '@/lib/ai/complete';
import { resolveModel, resolveProvider } from '@/lib/ai/provider';

import { BRIEF_PARSE_SYSTEM, briefParseUser } from './prompt';
import { briefTaskSchema, type BriefTask } from './types';
import { extractJson } from './verdict';

const MAX_PASTE_CHARS = 60_000;

export type ParseFailure =
  | { error: 'not-configured'; message: string }
  | { error: 'too-large'; message: string }
  | { error: 'empty'; message: string }
  | { error: 'no-tasks'; message: string }
  | { error: 'model-failed'; message: string };

export type ParseSuccess = {
  sourceLabel: string;
  tasks: BriefTask[];
};

export type ParseResult =
  | { ok: true; data: ParseSuccess }
  | { ok: false; failure: ParseFailure };

export async function parseBrief(paste: string): Promise<ParseResult> {
  const trimmed = paste.trim();
  if (!trimmed) {
    return {
      ok: false,
      failure: { error: 'empty', message: 'There was nothing to parse.' },
    };
  }
  if (trimmed.length > MAX_PASTE_CHARS) {
    return {
      ok: false,
      failure: {
        error: 'too-large',
        message: `Paste is ${trimmed.length.toLocaleString()} characters. The parser accepts up to ${MAX_PASTE_CHARS.toLocaleString()} at a time.`,
      },
    };
  }

  const provider = resolveProvider();
  const response = await complete({
    system: BRIEF_PARSE_SYSTEM,
    user: briefParseUser(trimmed),
    model: resolveModel('brief', provider.provider),
    maxTokens: 8000,
  });

  if (!response.ok) {
    if (response.error === 'not-configured') {
      return {
        ok: false,
        failure: {
          error: 'not-configured',
          message: response.message,
        },
      };
    }
    return {
      ok: false,
      failure: { error: 'model-failed', message: response.message },
    };
  }

  const json = extractJson(response.text);
  if (!json) {
    return {
      ok: false,
      failure: {
        error: 'model-failed',
        message: 'The parser returned something that was not JSON.',
      },
    };
  }

  const sourceLabel =
    typeof json.sourceLabel === 'string' && json.sourceLabel.trim()
      ? json.sourceLabel.trim()
      : 'Untitled brief';

  const taskInputs = Array.isArray(json.tasks) ? json.tasks : [];
  const tasks: BriefTask[] = [];
  for (const input of taskInputs) {
    const parsed = briefTaskSchema.safeParse(input);
    if (parsed.success) tasks.push(parsed.data);
    // A malformed task is dropped rather than failing the whole parse: partial
    // extraction is more useful than "the model produced 22 tasks and one of
    // them had a typo, so you get zero".
  }

  if (tasks.length === 0) {
    return {
      ok: false,
      failure: {
        error: 'no-tasks',
        message:
          'The parser found no concrete tasks in that. Try pasting a syllabus, practical sheet, or set of "write a program that…" prompts.',
      },
    };
  }

  return { ok: true, data: { sourceLabel, tasks } };
}
