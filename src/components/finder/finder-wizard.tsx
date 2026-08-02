"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { OptionList, type FinderOption } from "@/components/finder/option-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ANY_STATE,
  BUDGET_BANDS,
  FINDER_STEPS,
  QUALIFICATIONS,
  TOTAL_STEPS,
} from "@/config/finder";
import { readUtmParams, trackLead } from "@/lib/analytics";
import type { FinderOptions } from "@/lib/queries/finder";
import type { FinderAnswers } from "@/lib/validations/finder";

type Contact = { name: string; phone: string; email: string };

/**
 * zod and sonner are only needed once — on the last step and on a validation
 * miss. Importing them at the call site keeps ~65 kB out of the wizard's first
 * load, which matters on the 3G Android traffic this page targets (§11, §15).
 */
async function showError(message: string) {
  const { toast } = await import("sonner");
  toast.error(message);
}

/**
 * §5.4 — the six-step College Finder.
 *
 * Every step is saved to `finder_sessions` as the student moves forward, so an
 * abandoned funnel is still recoverable (§5.4). The final step creates the lead
 * with `source='college_finder'` and the answers attached, then hands off to
 * the server-rendered match list.
 */
export function FinderWizard({ options }: { options: FinderOptions }) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<FinderAnswers>({});
  const [contact, setContact] = React.useState<Contact>({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof Contact, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const current = FINDER_STEPS[step - 1]!;

  /** Courses the chosen qualification actually allows, narrowed by stream. */
  const allowedLevels: readonly string[] =
    QUALIFICATIONS.find((q) => q.value === answers.qualification)?.levels ?? [];
  const courseOptions: FinderOption[] = options.courses
    .filter(
      (course) =>
        (allowedLevels.length === 0 || allowedLevels.includes(course.level)) &&
        (!answers.stream || course.stream === answers.stream),
    )
    .map((course) => ({ value: course.slug, label: course.name }));

  const cityOptions: FinderOption[] = [
    { value: ANY_STATE, label: "Any city in this state" },
    ...options.cities
      .filter((city) => !answers.state || answers.state === ANY_STATE || city.state === answers.state)
      .map((city) => ({ value: city.slug, label: city.name })),
  ];

  /** Fire-and-forget: a failed save must never block the funnel (§5.4). */
  const persist = React.useCallback(
    (nextStep: number, nextAnswers: FinderAnswers, leadId?: string) => {
      void fetch("/api/finder/step", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          step: nextStep,
          answers: nextAnswers,
          ...(leadId ? { lead_id: leadId } : {}),
        }),
      }).catch(() => {});
    },
    [],
  );

  const choose = (patch: FinderAnswers) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
  };

  const next = () => {
    // §5.4 — the exact copy the spec asks for on an unanswered step.
    if (!isStepAnswered()) {
      void showError("Please select an option to proceed.");
      return;
    }
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    persist(nextStep, answers);
    setStep(nextStep);
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  function isStepAnswered() {
    switch (current.key) {
      case "qualification":
        return Boolean(answers.qualification);
      case "stream":
        return Boolean(answers.stream);
      case "course":
        // A stream with no mapped course must not trap the student here.
        return Boolean(answers.course) || courseOptions.length === 0;
      case "budget":
        return Boolean(answers.budget);
      case "location":
        return Boolean(answers.state);
      default:
        return true;
    }
  }

  async function submit() {
    // Same schema the server enforces — shared, never re-implemented.
    const { leadFormSchema } = await import("@/lib/validations/lead");
    const parsed = leadFormSchema
      .pick({ name: true, phone: true, email: true })
      .safeParse(contact);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        phone: fieldErrors.phone?.[0],
        email: fieldErrors.email?.[0],
      });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...contact,
          country_code: "+91",
          city: answers.city && answers.city !== ANY_STATE ? answers.city : "",
          source: "college_finder",
          // §5.4 — the six answers ride along on the lead so a counsellor sees
          // the whole funnel without joining finder_sessions.
          answers,
          page_url: window.location.href,
          ...readUtmParams(),
        }),
      });
      const result = (await response.json()) as { ok: boolean; id?: string; error?: string };

      if (!response.ok || !result.ok) {
        void showError(result.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      trackLead("college_finder", result.id ?? null);
      persist(TOTAL_STEPS, answers, result.id);

      // The match list is server-rendered from the answers in the URL, so it
      // reuses the /colleges query layer instead of a second client fetch.
      const params = new URLSearchParams({ matched: "1" });
      if (answers.stream) params.set("stream", answers.stream);
      if (answers.course) params.set("course", answers.course);
      if (answers.budget) params.set("fee", answers.budget);
      if (answers.state && answers.state !== ANY_STATE) params.set("state", answers.state);
      if (answers.city && answers.city !== ANY_STATE) params.set("city", answers.city);
      router.push(`/college-finder?${params}`);
    } catch {
      void showError("We could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-blue tabular-nums">
            Step {step}/{TOTAL_STEPS}
          </span>
          <span className="text-muted-foreground">{current.help}</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-brand-blue-50"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-h3">{current.title}</h2>

        <div className="mt-5">
          {current.key === "qualification" ? (
            <OptionList
              name="qualification"
              value={answers.qualification}
              onSelect={(value) =>
                // Changing qualification invalidates a course from the old level.
                choose({ qualification: value, course: undefined })
              }
              options={QUALIFICATIONS.map((q) => ({ value: q.value, label: q.label }))}
            />
          ) : null}

          {current.key === "stream" ? (
            <OptionList
              name="stream"
              columns={2}
              value={answers.stream}
              onSelect={(value) => choose({ stream: value, course: undefined })}
              options={options.streams.map((s) => ({ value: s.slug, label: s.name }))}
            />
          ) : null}

          {current.key === "course" ? (
            <OptionList
              name="course"
              columns={2}
              value={answers.course}
              onSelect={(value) => choose({ course: value })}
              options={courseOptions}
            />
          ) : null}

          {current.key === "budget" ? (
            <OptionList
              name="budget"
              value={answers.budget}
              onSelect={(value) => choose({ budget: value })}
              options={BUDGET_BANDS.map((b) => ({ value: b.value, label: b.label }))}
            />
          ) : null}

          {current.key === "location" ? (
            <div className="grid gap-5">
              <div>
                <p className="mb-2 font-medium text-ink">State</p>
                <OptionList
                  name="state"
                  columns={2}
                  value={answers.state}
                  onSelect={(value) => choose({ state: value, city: undefined })}
                  options={[
                    { value: ANY_STATE, label: "Anywhere in India" },
                    ...options.states.map((s) => ({ value: s.slug, label: s.name })),
                  ]}
                />
              </div>
              {answers.state && answers.state !== ANY_STATE ? (
                <div>
                  <p className="mb-2 font-medium text-ink">City (optional)</p>
                  <OptionList
                    name="city"
                    columns={2}
                    value={answers.city}
                    onSelect={(value) => choose({ city: value })}
                    options={cityOptions}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {current.key === "contact" ? (
            <div className="grid gap-4">
              <Field label="Full name" error={errors.name} required>
                {(id) => (
                  <Input
                    id={id}
                    className="h-11"
                    autoComplete="name"
                    placeholder="Your name"
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Mobile number" error={errors.phone} required>
                {(id) => (
                  <Input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-11"
                    autoComplete="tel-national"
                    placeholder="10-digit mobile"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    className="h-11"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  />
                )}
              </Field>
              <p className="text-sm text-muted-foreground">
                Free for students. We never charge admission fees on a
                college&apos;s behalf.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft />
            Previous
          </Button>

          {step < TOTAL_STEPS ? (
            <Button size="lg" onClick={next}>
              Next
              <ArrowRight />
            </Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Finding colleges…
                </>
              ) : (
                "Show my colleges"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children(id)}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
