"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/validations/review";

/**
 * §5.3 — review submission. Every review lands as `pending`, so the form says
 * so plainly rather than implying it is live.
 */
export function ReviewForm({
  collegeId,
  collegeName,
}: {
  collegeId: string;
  collegeName: string;
}) {
  const [submitted, setSubmitted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      name: "",
      email: "",
      course: "",
      rating: 0,
      title: "",
      body: "",
      hp: "",
    },
  });

  const rating = Number(form.watch("rating") ?? 0);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, college_id: collegeId }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setFormError("We could not reach the server. Please try again.");
    }
  });

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-success/30 bg-success/5 p-5"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-7 text-success" aria-hidden />
        <h3 className="mt-2 text-h3">Thanks for the review</h3>
        <p className="mt-1 text-body">
          It is with our editors now. Approved reviews usually appear within a
          couple of working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-xl border p-5">
      <div>
        <h3 className="text-h3">Write a review</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Studied at {collegeName}? Your review is published after an editor
          checks it.
        </p>
      </div>

      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="review-hp">Leave this field empty</label>
        <input id="review-hp" type="text" tabIndex={-1} autoComplete="off" {...form.register("hp")} />
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="text-sm font-medium">
          Your rating <span className="text-destructive">*</span>
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={rating === value}
              onClick={() => form.setValue("rating", value, { shouldValidate: true })}
              className="rounded p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Star
                className={cn(
                  "size-7",
                  value <= rating
                    ? "fill-brand-amber text-brand-amber"
                    : "text-border",
                )}
              />
            </button>
          ))}
        </div>
        {form.formState.errors.rating ? (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.rating.message}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={form.formState.errors.name?.message} required>
          {(id) => (
            <Input id={id} className="h-10" autoComplete="name" {...form.register("name")} />
          )}
        </Field>
        <Field label="Course you studied" error={form.formState.errors.course?.message}>
          {(id) => (
            <Input
              id={id}
              className="h-10"
              placeholder="e.g. B.Tech CSE"
              {...form.register("course")}
            />
          )}
        </Field>
      </div>

      <Field label="Email (optional)" error={form.formState.errors.email?.message}>
        {(id) => (
          <Input
            id={id}
            type="email"
            className="h-10"
            autoComplete="email"
            {...form.register("email")}
          />
        )}
      </Field>

      <Field label="Headline" error={form.formState.errors.title?.message} required>
        {(id) => (
          <Input
            id={id}
            className="h-10"
            placeholder="Sum up your experience in one line"
            {...form.register("title")}
          />
        )}
      </Field>

      <Field label="Your review" error={form.formState.errors.body?.message} required>
        {(id) => (
          <textarea
            id={id}
            rows={5}
            maxLength={2000}
            placeholder="Placements, faculty, hostel, fees — what would you tell a friend?"
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            {...form.register("body")}
          />
        )}
      </Field>

      {formError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="justify-self-start">
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit review"
        )}
      </Button>
    </form>
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
