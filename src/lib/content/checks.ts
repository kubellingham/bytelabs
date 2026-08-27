import { z } from 'zod';

/**
 * The requirement check DSL.
 *
 * Checks are declarative data, not code, for three reasons: they are authored
 * alongside content, the same evaluator serves both Course graduations and Ground
 * scenarios, and they have to be executed inside a sandboxed iframe that cannot be
 * handed arbitrary functions.
 *
 * Strings may contain `{{placeholder}}` tokens, resolved against a scenario variant
 * before evaluation. Because the requirement list itself is shared by every variant,
 * varying the client never varies the rigour.
 */

const selector = z.string().min(1);

export const checkSchema = z.discriminatedUnion('kind', [
  /** An element exists, optionally a bounded number of times, optionally nested. */
  z.object({
    kind: z.literal('element'),
    selector,
    /** Defaults to at least one. */
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().nonnegative().optional(),
    /** Restrict the search to descendants of this selector. */
    within: selector.optional(),
  }),

  /** Text content of the first match. */
  z.object({
    kind: z.literal('text'),
    selector,
    contains: z.string().optional(),
    matches: z.string().optional(),
    /** Any non-whitespace content at all. */
    nonEmpty: z.boolean().optional(),
  }),

  /** An attribute on every match — how `alt` on every image is asserted. */
  z.object({
    kind: z.literal('attribute'),
    selector,
    attribute: z.string().min(1),
    present: z.boolean().optional(),
    equals: z.string().optional(),
    contains: z.string().optional(),
    nonEmpty: z.boolean().optional(),
    /** Require it of every match rather than just the first. */
    everyMatch: z.boolean().optional(),
  }),

  /**
   * Computed style, optionally at a given viewport width. This is what makes
   * responsive requirements checkable without asking a human to eyeball it.
   */
  z.object({
    kind: z.literal('computedStyle'),
    selector,
    property: z.string().min(1),
    equals: z.string().optional(),
    contains: z.string().optional(),
    /** Numeric comparison after stripping units, for things like column counts. */
    minNumber: z.number().optional(),
    maxNumber: z.number().optional(),
    atWidth: z.number().int().positive().optional(),
  }),

  /** The page does not scroll sideways at a width. The commonest responsive bug. */
  z.object({
    kind: z.literal('noOverflow'),
    atWidth: z.number().int().positive(),
  }),

  /**
   * A label is genuinely associated with a control — via `for`, or by wrapping it.
   * Expressible in raw selectors only clumsily, and central to the forms chapter.
   */
  z.object({
    kind: z.literal('labelledControl'),
    selector,
  }),

  /** Heading levels descend without skipping. The outline, asserted. */
  z.object({
    kind: z.literal('headingOutline'),
    /** Require exactly one h1. */
    singleH1: z.boolean().optional(),
  }),

  /**
   * Focusing the control produces a visible indicator.
   *
   * Evaluated by actually focusing the element and comparing outline and box-shadow
   * before and after, because `:focus-visible` styles cannot be read off an
   * unfocused element. This is the only way to assert the brief's "you must be able
   * to see where you are when tabbing" without asking a human to look.
   */
  z.object({
    kind: z.literal('focusIndicator'),
    selector,
  }),
]);

export type Check = z.infer<typeof checkSchema>;
export type CheckKind = Check['kind'];

export const requirementSchema = z.object({
  id: z.string().min(1),
  /** Shown to the learner as a line of the brief. Never framed as a test. */
  label: z.string().min(1),
  /** Concepts credited when this requirement goes green. */
  concepts: z.array(z.string()).default([]),
  /**
   * How the checks combine. `all` is the default and the common case; `any` exists
   * for requirements that legitimately accept more than one solution, so a brief
   * saying "grid or flexbox" is not quietly enforced as "grid".
   */
  mode: z.enum(['all', 'any']).default('all'),
  checks: z.array(checkSchema).min(1),
});

export type Requirement = z.infer<typeof requirementSchema>;
/** Authoring shape: `mode` and `concepts` may be omitted. */
export type RequirementInput = z.input<typeof requirementSchema>;

export interface CheckResult {
  requirementId: string;
  satisfied: boolean;
  /** Present when unsatisfied: what is still missing, in the learner's language. */
  detail?: string;
}
