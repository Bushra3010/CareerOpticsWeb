import { z } from "zod";

import { BUDGET_BANDS, FINDER_STEPS, QUALIFICATIONS } from "@/config/finder";

/**
 * College Finder payloads — PRD §5.4, §8 `/api/finder/step`.
 *
 * Every field is optional because a partial session is the whole point: the
 * wizard saves after each step so an abandoned funnel is still recoverable and
 * a counsellor can follow up on a half-finished answer set.
 */
export const finderAnswersSchema = z.object({
  qualification: z
    .enum(QUALIFICATIONS.map((q) => q.value) as [string, ...string[]])
    .optional(),
  stream: z.string().trim().max(80).optional(),
  course: z.string().trim().max(80).optional(),
  budget: z
    .enum(BUDGET_BANDS.map((b) => b.value) as [string, ...string[]])
    .optional(),
  state: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
});

export type FinderAnswers = z.infer<typeof finderAnswersSchema>;

export const finderStepSchema = z.object({
  /** 1-based, matches `finder_sessions.step` and the progress bar. */
  step: z.number().int().min(1).max(FINDER_STEPS.length),
  answers: finderAnswersSchema,
  /** Set on the last call, once /api/leads has returned an id. */
  lead_id: z.uuid().optional(),
});

export type FinderStepPayload = z.infer<typeof finderStepSchema>;
