/**
 * The inline formatting the tutor panel understands.
 *
 * Markdown-lite and deliberately small — backticks for code, and asterisks for
 * emphasis — parsed here rather than by pulling in a markdown library. The content
 * schema decides what is expressible; anything richer should become a new block
 * kind rather than a looser parser.
 *
 * Kept as a pure function so it can be tested directly. Unsupported syntax leaking
 * through as literal asterisks is exactly the kind of thing nobody notices until a
 * learner is looking at it.
 */

export type InlineToken =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'em'; text: string };

// Order matters: `**bold**` has to be tried before `*italic*`, or the italic rule
// would claim the opening pair of every bold run.
const PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];

  for (const part of text.split(PATTERN)) {
    if (part.length === 0) continue;

    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      tokens.push({ kind: 'code', text: part.slice(1, -1) });
    } else if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      tokens.push({ kind: 'strong', text: part.slice(2, -2) });
    } else if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      tokens.push({ kind: 'em', text: part.slice(1, -1) });
    } else {
      tokens.push({ kind: 'text', text: part });
    }
  }

  return tokens;
}
