"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, MessageCircle, Phone } from "lucide-react";

import { PhotoUpload } from "@/components/forms/photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig, telHref, whatsappHref } from "@/config/site";
import { readUtmParams, trackLead } from "@/lib/analytics";
import type { CollegeOption, CourseOption } from "@/lib/queries/leads";
import { cn } from "@/lib/utils";
import {
  ADMISSION_KEYS,
  CATEGORY_OPTIONS,
  COUNTRY_CODES,
  LEVEL_OPTIONS,
  leadFormSchema,
  type LeadFormValues,
  type LeadSource,
} from "@/lib/validations/lead";

/** Optional fields a caller can switch on. Name and phone are always shown. */
export type LeadField =
  | "email"
  | "city"
  | "level"
  | "course"
  | "college"
  | "message"
  /** The counsellors' paper admission form (§5.3 Apply). */
  | "admission";

const FIELD_HEIGHT = "h-10";

/**
 * The single lead capture form (PRD §5.1, §9). Every entry point renders this
 * with a different `source` and field set, so all leads land in one shape.
 *
 * On success it swaps to an inline thank-you card with a WhatsApp CTA rather
 * than redirecting — §9 step 5 keeps the pixel event on the same page.
 */
export type LeadResponse = {
  ok: boolean;
  id?: string | null;
  error?: string;
  /** Set by /api/brochure — a short-lived signed download link. */
  url?: string | null;
  expiresIn?: number;
};

export function LeadForm({
  source,
  fields = [],
  courses = [],
  colleges = [],
  collegeId,
  courseId,
  submitLabel = "Get Free Counselling",
  endpoint = "/api/leads",
  className,
  successExtra,
  onSuccess,
}: {
  source: LeadSource;
  fields?: LeadField[];
  courses?: CourseOption[];
  colleges?: CollegeOption[];
  /** Pre-selected college, e.g. Apply Now on a college card. */
  collegeId?: string;
  courseId?: string;
  submitLabel?: string;
  /** `/api/brochure` reuses this form; it takes the same payload shape. */
  endpoint?: string;
  className?: string;
  /** Extra content in the thank-you card, e.g. the brochure download link. */
  successExtra?: (result: LeadResponse) => React.ReactNode;
  onSuccess?: (result: LeadResponse) => void;
}) {
  const [submitted, setSubmitted] = React.useState<{
    name: string;
    result: LeadResponse;
  } | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      country_code: "+91",
      city: "",
      level: undefined,
      course_id: courseId ?? "",
      college_id: collegeId ?? "",
      message: "",
      hp: "",
      father_name: "",
      dob: "",
      parent_phone: "",
      father_occupation: "",
      address_village: "",
      address_post: "",
      address_district: "",
      address_state: "",
      student_class: "",
      roll_code: "",
      roll_no: "",
      category: "",
      photo_path: "",
    },
  });

  const show = (field: LeadField) => fields.includes(field);
  const countryCode = form.watch("country_code") ?? "+91";

  // Only the levels a seeded course actually uses, so the select never offers
  // a level with nothing behind it.
  const levelOptions = LEVEL_OPTIONS.filter(
    (level) => !show("course") || courses.some((course) => course.level === level.value),
  );
  const selectedLevel = form.watch("level");
  const courseOptions = selectedLevel
    ? courses.filter((course) => course.level === selectedLevel)
    : courses;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);

    try {
      // The admission fields are not columns on `leads`; they travel in the
      // existing `answers` jsonb so no migration or API change is needed.
      const payload: Record<string, unknown> = { ...values };
      const answers: Record<string, string> = {};
      for (const key of ADMISSION_KEYS) {
        const value = payload[key];
        if (typeof value === "string" && value.trim()) {
          answers[key] = value.trim();
        }
        delete payload[key];
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ...(Object.keys(answers).length > 0 ? { answers } : {}),
          source,
          page_url: window.location.href,
          ...readUtmParams(),
        }),
      });

      const result = (await response.json()) as LeadResponse;

      if (!response.ok || !result.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      trackLead(source, result.id ?? null);
      setSubmitted({ name: values.name, result });
      onSuccess?.(result);
    } catch {
      setFormError(
        `We could not reach the server. Please call ${siteConfig.phoneDisplay} instead.`,
      );
    }
  });

  if (submitted) {
    return (
      <div
        className={cn("rounded-xl border border-success/30 bg-success/5 p-5", className)}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h3 className="mt-3 text-h3">Thanks, {submitted.name.split(" ")[0]}!</h3>
        <p className="mt-1 text-body">
          A counsellor will call you within 24 hours on working days. Prefer to
          talk now? Message us on WhatsApp.
        </p>
        {successExtra ? (
          <div className="mt-4">{successExtra(submitted.result)}</div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <a
              href={whatsappHref(
                `Hi ${siteConfig.name}, I just submitted an enquiry. My name is ${submitted.name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Chat on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={telHref}>
              <Phone />
              {siteConfig.phoneDisplay}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("grid gap-4", className)}>
      {/* Honeypot — off-screen rather than display:none, which some bots skip. */}
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor={`hp-${source}`}>Leave this field empty</label>
        <input
          id={`hp-${source}`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("hp")}
        />
      </div>

      <Field label="Full name" error={form.formState.errors.name?.message} required>
        {(id, invalid) => (
          <Input
            id={id}
            className={FIELD_HEIGHT}
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={invalid}
            {...form.register("name")}
          />
        )}
      </Field>

      <Field label="Mobile number" error={form.formState.errors.phone?.message} required>
        {(id, invalid) => (
          <div className="flex gap-2">
            <Select
              value={countryCode}
              onValueChange={(value) => form.setValue("country_code", value)}
            >
              <SelectTrigger
                className={cn(FIELD_HEIGHT, "w-[104px] shrink-0")}
                aria-label="Country code"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id={id}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className={FIELD_HEIGHT}
              autoComplete="tel-national"
              placeholder="10-digit mobile"
              aria-invalid={invalid}
              {...form.register("phone")}
            />
          </div>
        )}
      </Field>

      {show("email") ? (
        <Field label="Email (optional)" error={form.formState.errors.email?.message}>
          {(id, invalid) => (
            <Input
              id={id}
              type="email"
              className={FIELD_HEIGHT}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={invalid}
              {...form.register("email")}
            />
          )}
        </Field>
      ) : null}

      {show("city") ? (
        <Field label="Your city" error={form.formState.errors.city?.message}>
          {(id) => (
            <Input
              id={id}
              className={FIELD_HEIGHT}
              autoComplete="address-level2"
              placeholder="e.g. Patna"
              {...form.register("city")}
            />
          )}
        </Field>
      ) : null}

      {show("college") && colleges.length > 0 ? (
        <Field label="University you are interested in">
          {(id) => (
            <Select
              value={form.watch("college_id") || undefined}
              onValueChange={(value) => form.setValue("college_id", value)}
            >
              <SelectTrigger id={id} className={cn(FIELD_HEIGHT, "w-full")}>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      ) : null}

      {show("level") ? (
        <Field label="Course type">
          {(id) => (
            <Select
              value={form.watch("level") || undefined}
              onValueChange={(value) => {
                form.setValue("level", value);
                // A course from the previous level would no longer be offered.
                form.setValue("course_id", "");
              }}
            >
              <SelectTrigger id={id} className={cn(FIELD_HEIGHT, "w-full")}>
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      ) : null}

      {show("course") && courses.length > 0 ? (
        <Field label="Course">
          {(id) => (
            <Select
              value={form.watch("course_id") || undefined}
              onValueChange={(value) => form.setValue("course_id", value)}
            >
              <SelectTrigger id={id} className={cn(FIELD_HEIGHT, "w-full")}>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      ) : null}

      {show("admission") ? (
        <fieldset className="grid gap-4 rounded-xl border bg-surface p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            Admission details
          </legend>
          <p className="-mt-1 text-sm text-muted-foreground">
            Optional — it saves time on the call, but a counsellor can fill
            these in with you.
          </p>

          <PhotoUpload
            value={form.watch("photo_path") ?? ""}
            onChange={(path) => form.setValue("photo_path", path)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Father's name"
              error={form.formState.errors.father_name?.message}
            >
              {(id) => (
                <Input
                  id={id}
                  className={FIELD_HEIGHT}
                  {...form.register("father_name")}
                />
              )}
            </Field>
            <Field
              label="Father's occupation"
              error={form.formState.errors.father_occupation?.message}
            >
              {(id) => (
                <Input
                  id={id}
                  className={FIELD_HEIGHT}
                  {...form.register("father_occupation")}
                />
              )}
            </Field>
            <Field label="Date of birth" error={form.formState.errors.dob?.message}>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  className={FIELD_HEIGHT}
                  {...form.register("dob")}
                />
              )}
            </Field>
            <Field
              label="Parent's mobile"
              error={form.formState.errors.parent_phone?.message}
            >
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  className={FIELD_HEIGHT}
                  {...form.register("parent_phone")}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Village" error={form.formState.errors.address_village?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("address_village")} />
              )}
            </Field>
            <Field label="Post" error={form.formState.errors.address_post?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("address_post")} />
              )}
            </Field>
            <Field label="District" error={form.formState.errors.address_district?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("address_district")} />
              )}
            </Field>
            <Field label="State" error={form.formState.errors.address_state?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("address_state")} />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Class" error={form.formState.errors.student_class?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="e.g. 12th"
                  className={FIELD_HEIGHT}
                  {...form.register("student_class")}
                />
              )}
            </Field>
            <Field label="Roll code" error={form.formState.errors.roll_code?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("roll_code")} />
              )}
            </Field>
            <Field label="Roll number" error={form.formState.errors.roll_no?.message}>
              {(id) => (
                <Input id={id} className={FIELD_HEIGHT} {...form.register("roll_no")} />
              )}
            </Field>
          </div>

          <Field label="Category">
            {(id) => (
              <Select
                value={form.watch("category") || undefined}
                onValueChange={(value) => form.setValue("category", value)}
              >
                <SelectTrigger id={id} className={FIELD_HEIGHT}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </fieldset>
      ) : null}

      {show("message") ? (
        <Field label="What do you need help with?">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              maxLength={1000}
              placeholder="Tell us your marks, budget or preferred city"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              {...form.register("message")}
            />
          )}
        </Field>
      ) : null}

      {formError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Sending…
          </>
        ) : (
          submitLabel
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        Free for students. We never charge admission fees on a college&apos;s behalf.
      </p>
    </form>
  );
}

/** Label + control + error message, wired together for §6.5's real-label rule. */
function Field({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: (id: string, invalid: boolean) => React.ReactNode;
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
      {children(id, Boolean(error))}
      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
