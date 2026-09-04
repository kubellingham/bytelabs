import { z } from 'zod';

/**
 * A BriefTask is a runtime-parsed unit of work.
 *
 * Unlike a `Scenario` or `Lesson` — which are compile-time-validated content —
 * a task is generated on demand from whatever the learner pasted in. The parser
 * (Claude, server-side) normalises any shape of input (a syllabus, a WhatsApp
 * question, a code demo) into this same shape.
 */

export const briefLanguageSchema = z.enum([
  'python',
  'html',
  'css',
  'javascript',
  'other',
]);
export type BriefLanguage = z.infer<typeof briefLanguageSchema>;

/**
 * The optional oracle for a task. When present, the room can auto-verdict; when
 * absent, the room falls back to a self-mark UI.
 *
 *  - `stdout-equals` / `stdout-contains`: for Python and other stdout-producing runtimes.
 *  - `html-contains`: for HTML output; substring match against the rendered document text.
 *  - `self-mark`: no oracle — the learner claims completion when done.
 */
export const briefExpectedSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stdout-equals'), value: z.string().min(1) }),
  z.object({ kind: z.literal('stdout-contains'), value: z.string().min(1) }),
  z.object({ kind: z.literal('html-contains'), value: z.string().min(1) }),
  z.object({ kind: z.literal('self-mark') }),
]);
export type BriefExpected = z.infer<typeof briefExpectedSchema>;

export const briefTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** The ask in the learner's language. May be multi-paragraph. */
  prompt: z.string().min(1),
  language: briefLanguageSchema,
  /**
   * File contents the learner starts with — a data variable, a class stub,
   * whatever the paste supplied inline. Empty when the ask is "write from scratch".
   */
  starterFiles: z.record(z.string().min(1), z.string()).default({}),
  expected: briefExpectedSchema.default({ kind: 'self-mark' }),
});
export type BriefTask = z.infer<typeof briefTaskSchema>;
export type BriefTaskInput = z.input<typeof briefTaskSchema>;

export const briefSessionSchema = z.object({
  id: z.string().min(1),
  /** Where the tasks came from, in one line. E.g. "CSE91D Syllabus — 27 tasks". */
  sourceLabel: z.string().min(1),
  createdAt: z.number().int().positive(),
  tasks: z.array(briefTaskSchema).min(1),
});
export type BriefSession = z.infer<typeof briefSessionSchema>;
