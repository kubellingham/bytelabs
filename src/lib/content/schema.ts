import { z } from 'zod';

import { requirementSchema } from './checks';

/** Path -> file contents. Multi-file from the start: Unit 1 teaches linking a stylesheet. */
export const workspaceFilesSchema = z.record(z.string().min(1), z.string());
export type WorkspaceFiles = z.infer<typeof workspaceFilesSchema>;

/**
 * Prose blocks for the left-hand tutor panel. A small closed set rather than raw
 * markdown, so the panel can style each kind deliberately and content stays
 * validatable. Inline `code` and **bold** are supported inside text.
 */
export const proseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('p'), text: z.string().min(1) }),
  z.object({ kind: z.literal('heading'), text: z.string().min(1) }),
  z.object({
    kind: z.literal('list'),
    ordered: z.boolean().optional(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('code'),
    language: z.enum(['html', 'css', 'js', 'text']).default('text'),
    code: z.string().min(1),
  }),
  /** A short aside. Used sparingly — the doc is explicit about not over-explaining. */
  z.object({ kind: z.literal('note'), text: z.string().min(1) }),
]);
export type Prose = z.infer<typeof proseSchema>;

/**
 * One edit in a demo beat.
 *
 * Anchors are string-based rather than line/column so content survives being
 * edited: `after` inserts following the first occurrence, `replace` swaps the
 * first occurrence, and neither present appends to the end of the file.
 */
export const editSchema = z.object({
  file: z.string().min(1),
  text: z.string(),
  after: z.string().optional(),
  replace: z.string().optional(),
});
export type Edit = z.infer<typeof editSchema>;

/**
 * The concurrent typing mechanic: a note in the left panel, and the specific lines
 * it is talking about typing themselves on the right. Not the whole file at once —
 * the code responds to the words.
 */
export const beatSchema = z.object({
  id: z.string().min(1),
  note: z.string().min(1),
  /** Tagged per beat, not per lesson, because that is the granularity ghost fade needs. */
  concepts: z.array(z.string()).default([]),
  edits: z.array(editSchema).min(1),
  /** Beat-specific pacing override, in ms per character. */
  charMs: z.number().positive().optional(),
  /** A deliberate pause after this beat lands, in ms. */
  holdMs: z.number().nonnegative().optional(),
});
export type Beat = z.infer<typeof beatSchema>;

export const stepSchema = z.discriminatedUnion('kind', [
  /** Act 1 — full screen, no editor. Understanding before keyboard. */
  z.object({
    kind: z.literal('explain'),
    id: z.string().min(1),
    title: z.string().min(1),
    body: z.array(proseSchema).min(1),
    concepts: z.array(z.string()).default([]),
  }),

  /** Act 3 — the split is open and code types itself, beat by beat. */
  z.object({
    kind: z.literal('demo'),
    id: z.string().min(1),
    title: z.string().min(1),
    beats: z.array(beatSchema).min(1),
  }),

  /**
   * Act 4 — the same code, now ghosted, and the learner types over it. Ghost
   * opacity comes from the mastery engine at runtime, not from the content.
   */
  z.object({
    kind: z.literal('practice'),
    id: z.string().min(1),
    prompt: z.string().min(1),
    /** Which files the learner rewrites. Others stay as the demo left them. */
    files: z.array(z.string().min(1)).min(1),
    concepts: z.array(z.string()).default([]),
  }),

  /** An in-lesson checkpoint. Same engine as graduation, lower stakes. */
  z.object({
    kind: z.literal('check'),
    id: z.string().min(1),
    prompt: z.string().min(1),
    requirements: z.array(requirementSchema).min(1),
  }),
]);
export type Step = z.infer<typeof stepSchema>;

export const lessonSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  estimatedMinutes: z.number().int().positive().default(8),
  concepts: z.array(z.string()).default([]),
  /** Editor contents when the lesson opens. Beats are applied on top of this. */
  startFiles: workspaceFilesSchema.default({}),
  steps: z.array(stepSchema).min(1),
});
export type Lesson = z.infer<typeof lessonSchema>;

/** Unauthored units still ship, so the roadmap is visible rather than absent. */
export const contentStatusSchema = z.enum(['available', 'planned']);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

export const chapterSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: contentStatusSchema.default('planned'),
  lessons: z.array(lessonSchema).default([]),
});
export type Chapter = z.infer<typeof chapterSchema>;

/**
 * The graduation scenario. Deliberately shaped like a Ground scenario rather than
 * a test: a brief, requirements, no ghost text, no assistant. The learner walks
 * through the glass without being told it is there.
 */
export const graduationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brief: z.array(proseSchema).min(1),
  starterFiles: workspaceFilesSchema.default({}),
  requirements: z.array(requirementSchema).min(1),
});
export type Graduation = z.infer<typeof graduationSchema>;

export const unitSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  /** What this unit is for. Never states a difficulty — the lessons do that silently. */
  intent: z.string().min(1),
  status: contentStatusSchema.default('planned'),
  chapters: z.array(chapterSchema).default([]),
  graduation: graduationSchema.nullable().default(null),
});
export type Unit = z.infer<typeof unitSchema>;

export const trackSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  language: z.enum(['html-css', 'javascript', 'python']),
  /** The honest one-line promise the track makes. */
  promise: z.string().min(1),
  status: contentStatusSchema.default('planned'),
  units: z.array(unitSchema).default([]),
});
export type Track = z.infer<typeof trackSchema>;

/**
 * Tracks group into paths so the horizon is measured in years rather than in
 * whichever track the learner happens to be inside.
 */
export const pathSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  trackIds: z.array(z.string().min(1)).min(1),
});
export type LearningPath = z.infer<typeof pathSchema>;

/* ------------------------------------------------------------------ Ground */

export const scenarioTierSchema = z.enum(['beginner', 'intermediate', 'elite']);
export type ScenarioTier = z.infer<typeof scenarioTierSchema>;

/**
 * One parameterisation of a scenario: the client changes, the skills do not.
 * `values` are substituted into `{{placeholder}}` tokens in the brief and in the
 * requirement checks.
 */
export const variantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  values: z.record(z.string().min(1), z.string()),
});
export type Variant = z.infer<typeof variantSchema>;

export const scenarioSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  tier: scenarioTierSchema,
  trackId: z.string().min(1),
  /** Routing tags. Coarser tiers cannot answer "what should I do about flexbox". */
  skills: z.array(z.string().min(1)).min(1),
  concepts: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().default(25),
  /** Rendered per variant. The reason the scenario exists, in client language. */
  brief: z.array(proseSchema).min(1),
  variants: z.array(variantSchema).min(1),
  /**
   * Shared by every variant by construction — one array, not one per variant —
   * so no amount of brief variety can drift the standard.
   */
  requirements: z.array(requirementSchema).min(1),
  starterFiles: workspaceFilesSchema.default({}),
  /**
   * Assisted Mode's demonstration: the same concurrent typing mechanic as the
   * Course, showing one way through the brief before the learner is asked to write
   * it. Optional — a scenario without one still runs in Assisted Mode, it just has
   * the requirement detail and the assistant rather than a worked example.
   *
   * Beat text may carry `{{placeholders}}`, filled per variant like everything else,
   * so the demonstration is about the client the learner was actually given.
   */
  walkthrough: z.array(beatSchema).optional(),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const catalogSchema = z.object({
  paths: z.array(pathSchema).min(1),
  tracks: z.array(trackSchema).min(1),
  scenarios: z.array(scenarioSchema).default([]),
});
export type Catalog = z.infer<typeof catalogSchema>;

/*
 * Authoring types.
 *
 * Schema defaults mean the parsed (output) type requires fields an author should be
 * able to omit — `mode`, `concepts`, `status`. Content files are therefore annotated
 * with the *input* types, and the catalog parses them once into the output types the
 * rest of the app consumes. Authors omit what has a sensible default; runtime code
 * never has to check whether a default was applied.
 */
export type ProseInput = z.input<typeof proseSchema>;
export type BeatInput = z.input<typeof beatSchema>;
export type StepInput = z.input<typeof stepSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
export type ChapterInput = z.input<typeof chapterSchema>;
export type GraduationInput = z.input<typeof graduationSchema>;
export type UnitInput = z.input<typeof unitSchema>;
export type TrackInput = z.input<typeof trackSchema>;
export type LearningPathInput = z.input<typeof pathSchema>;
export type VariantInput = z.input<typeof variantSchema>;
export type ScenarioInput = z.input<typeof scenarioSchema>;
