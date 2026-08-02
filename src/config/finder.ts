/**
 * College Finder wizard vocabulary — PRD §5.4.
 *
 * Six steps: qualification → stream → course → budget → location → contact.
 * The step list is the single source of truth for the progress bar, the
 * validation messages and the `finder_sessions.step` column.
 */

export const FINDER_STEPS = [
  {
    key: "qualification",
    title: "Where are you right now?",
    help: "This decides which courses you are eligible for.",
  },
  {
    key: "stream",
    title: "Which stream interests you?",
    help: "Pick the field you want to build a career in.",
  },
  {
    key: "course",
    title: "Which course?",
    help: "Only courses you are eligible for are shown.",
  },
  {
    key: "budget",
    title: "What is your budget?",
    help: "Fees per year. We will only shortlist what you can afford.",
  },
  {
    key: "location",
    title: "Where do you want to study?",
    help: "Staying close to home usually costs less.",
  },
  {
    key: "contact",
    title: "Where should the counsellor call?",
    help: "We call within 24 hours on working days. Free, always.",
  },
] as const;

export type FinderStepKey = (typeof FINDER_STEPS)[number]["key"];
export const TOTAL_STEPS = FINDER_STEPS.length;

/**
 * Step 1 — current qualification, mapped to the `level_enum` values a student
 * at that stage can actually enrol in next.
 */
export const QUALIFICATIONS = [
  {
    value: "class-10",
    label: "Studying in or passed Class 10",
    levels: ["after_10", "diploma", "certificate"],
  },
  {
    value: "class-12",
    label: "Studying in or passed Class 12",
    levels: ["after_12", "ug"],
  },
  {
    value: "graduate",
    label: "Completed a bachelor degree",
    levels: ["pg"],
  },
  {
    value: "postgraduate",
    label: "Completed a master degree",
    levels: ["doctorate"],
  },
] as const;

export type QualificationValue = (typeof QUALIFICATIONS)[number]["value"];

/** Step 4 — budget bands, matched against `college_courses.fee_per_year`. */
export const BUDGET_BANDS = [
  { value: "50000", label: "Under ₹50,000 a year" },
  { value: "100000", label: "₹50,000 – ₹1 lakh a year" },
  { value: "200000", label: "₹1 – 2 lakh a year" },
  { value: "500000", label: "₹2 – 5 lakh a year" },
  { value: "1000000", label: "Above ₹5 lakh a year" },
] as const;

/** Step 5 — a student with no location preference should not be forced to pick. */
export const ANY_STATE = "any";
