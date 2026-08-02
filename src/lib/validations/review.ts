import { z } from "zod";

/**
 * Review submission — PRD §8 `/api/reviews`. Every submission lands with
 * `is_approved = false` and is only shown after an editor approves it in P10,
 * so this schema guards content quality, not publication.
 */
export const reviewSchema = z.object({
  college_id: z.uuid(),
  name: z.string().trim().min(2, "Enter your name").max(60, "Name is too long"),
  email: z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .optional(),
  course: z.string().trim().max(120).optional().or(z.literal("")),
  rating: z.coerce
    .number()
    .int("Pick a whole star rating")
    .min(1, "Pick a rating")
    .max(5, "Pick a rating"),
  title: z.string().trim().min(3, "Add a short headline").max(120),
  body: z
    .string()
    .trim()
    .min(30, "Tell us a little more — at least 30 characters")
    .max(2000, "Review is too long"),
  /** Honeypot, handled the same way as the lead form: accepted, dropped silently. */
  hp: z.string().optional(),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewPayload = z.output<typeof reviewSchema>;

/** Fields the visitor types; the college id comes from the page, not the form. */
export const reviewFormSchema = reviewSchema.omit({ college_id: true });
export type ReviewFormValues = z.input<typeof reviewFormSchema>;
