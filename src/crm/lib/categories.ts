/**
 * CareerOptics' four business lines. Every CRM lead and student carries one
 * (`crm.leads.category`, `crm.students.category`, migration 0031) so each
 * team can filter to its own work.
 */
export const CATEGORIES = [
  { value: 'credit_card', label: 'Student Credit Card', short: 'Credit Card', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'teacher_training', label: 'B.Ed / D.El.Ed', short: 'B.Ed / D.El.Ed', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'distance', label: 'Distance Education', short: 'Distance', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'open_school', label: 'NIOS / BBOSE (10th & 12th)', short: 'NIOS / BBOSE', color: 'bg-amber-100 text-amber-700 border-amber-200' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

export function categoryMeta(value: string | null | undefined) {
  return CATEGORIES.find((c) => c.value === value) ?? null
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.value === value)
}
