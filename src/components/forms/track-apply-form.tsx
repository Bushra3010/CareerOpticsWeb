"use client";

import * as React from "react";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Loader2, MessageCircle, Pencil } from "lucide-react";

import { DocumentUpload } from "@/components/forms/document-upload";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { type PaymentStep, UpiPaymentStep, UTR_PATTERN } from "@/components/forms/upi-payment-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentSlug } from "@/config/admission-form";
import { fieldOptions, findProgramme, type TrackField } from "@/config/admission-tracks";
import { siteConfig, whatsappHref } from "@/config/site";
import { cn } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

type StepId = "details" | "payment" | "documents" | "review";

const STEP_LABEL: Record<StepId, string> = {
  details: "Basic info",
  payment: "Payment",
  documents: "Documents",
  review: "Review",
};

/**
 * The public form behind a counsellor's link, for every track (B.Ed /
 * D.El.Ed, Student Credit Card, Distance, NIOS / BBOSE). It runs in steps —
 * basic info → payment (only when the link carries a fee) → documents →
 * review → final submit — and nothing is sent until the last step. Fields and
 * documents come from `config/admission-tracks.ts`; everything posts to
 * `/api/leads` inside `answers`, and the bridge files the lead under the track
 * and the link creator (0034), which then makes a pending student (0035).
 */
export function TrackApplyForm({
  programmeCode,
  linkCode,
  payment,
  colleges = [],
  level,
}: {
  programmeCode: string;
  linkCode: string;
  payment?: PaymentStep;
  /** Website college names, for fields with `optionsFrom: "colleges"`. */
  colleges?: string[];
  /** `leads.level` to record, e.g. "diploma" for D.El.Ed. */
  level?: string;
}) {
  const found = findProgramme(programmeCode);
  const [basic, setBasic] = React.useState({ name: "", phone: "", email: "" });
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [photo, setPhoto] = React.useState("");
  const [files, setFiles] = React.useState<Record<string, string>>({});
  const [verification, setVerification] = React.useState("");
  const [utr, setUtr] = React.useState("");
  const [screenshot, setScreenshot] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const hp = React.useRef<HTMLInputElement>(null);
  const top = React.useRef<HTMLDivElement>(null);

  if (!found) return null;
  const { track, programme } = found;

  const steps: StepId[] = payment ? ["details", "payment", "documents", "review"] : ["details", "documents", "review"];
  const step = steps[stepIndex];

  const visible = (f: TrackField) => !f.showIf || f.showIf.values.includes(answers[f.showIf.key] ?? "");
  const filled = track.sections.flatMap((s) => s.fields).filter((f) => visible(f) && answers[f.key]?.trim());
  const uploaded = programme.documents.filter((d) => files[documentSlug(d)]);

  const scrollTop = () => requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

  const goTo = (index: number) => {
    setFormError(null);
    setStepIndex(index);
    scrollTop();
  };

  /** Checks one step; true when it may be left. */
  const check = (id: StepId): boolean => {
    let next: Record<string, string | undefined> = {};
    if (id === "details") {
      next = {
        name: basic.name.trim().length >= 2 ? undefined : "Enter your full name",
        phone: /^[6-9]\d{9}$/.test(basic.phone) ? undefined : "Enter a 10-digit mobile number starting with 6-9",
        email: !basic.email || /^\S+@\S+\.\S+$/.test(basic.email) ? undefined : "Enter a valid email address",
      };
    } else if (id === "payment" && payment) {
      next = {
        utr: UTR_PATTERN.test(utr.trim()) ? undefined : "Enter the UTR / transaction ID shown in your UPI app after paying.",
        screenshot: screenshot ? undefined : "Attach a screenshot of the payment.",
      };
    }
    setErrors((e) => ({ ...e, ...next }));
    if (Object.values(next).some(Boolean)) {
      setFormError("Please check the highlighted fields.");
      return false;
    }
    return true;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step !== "review") {
      if (check(step)) goTo(stepIndex + 1);
      return;
    }
    setFormError(null);
    // Re-check every step: Edit may have jumped back and changed something.
    for (const [i, id] of steps.entries()) {
      if (!check(id)) return goTo(i);
    }

    const payload: Record<string, string> = { ref: linkCode, programme: programme.name, track: track.category };
    for (const f of filled) payload[f.key] = answers[f.key].trim().slice(0, 200);
    if (photo) payload.photo_path = photo;
    for (const [slug, path] of Object.entries(files)) if (path) payload[`file_${slug}`.slice(0, 40)] = path;
    if (uploaded.length) payload.documents_ready = uploaded.join(", ").slice(0, 200);
    if (verification) payload.verification_doc = verification;
    if (payment) {
      payload.payment_utr = utr.trim().toUpperCase();
      payload.file_payment_screenshot = screenshot;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: basic.name.trim(),
          phone: basic.phone,
          email: basic.email.trim(),
          country_code: "+91",
          city: (answers.address_district ?? "").trim().slice(0, 80),
          ...(level ? { level } : {}),
          source: "admission_form",
          page_url: window.location.href,
          answers: payload,
          hp: hp.current?.value ?? "",
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      scrollTop();
    } catch {
      setFormError(`We could not reach the server. Please call ${siteConfig.phoneDisplay} instead.`);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div ref={top} className="mt-6 scroll-mt-24 rounded-xl border border-success/30 bg-success/5 p-5" role="status" aria-live="polite">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h3 className="mt-3 text-h3">Thanks, {basic.name.trim().split(" ")[0]}!</h3>
        <p className="mt-1 text-body">
          Your {programme.name} form has reached our admission team. A counsellor will call you within 24 hours on
          working days.
        </p>
        {payment ? (
          <p className="mt-2 text-body">
            We have your payment details (UTR {utr.trim().toUpperCase()}). Our office will verify the payment and
            confirm.
          </p>
        ) : null}
        <Button asChild className="mt-4">
          <a
            href={whatsappHref(`Hi ${siteConfig.name}, I just submitted the ${programme.name} form. My name is ${basic.name.trim()}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Chat on WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid gap-5">
      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="hp-track">Leave this field empty</label>
        <input id="hp-track" ref={hp} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div ref={top} className="scroll-mt-24">
        <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Form steps">
          {steps.map((id, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "todo";
            return (
              <li key={id} className={cn("flex items-center gap-1.5 sm:gap-2", i < steps.length - 1 && "flex-1")}>
                <button
                  type="button"
                  disabled={i >= stepIndex}
                  onClick={() => goTo(i)}
                  aria-current={state === "current" ? "step" : undefined}
                  className="flex min-w-0 items-center gap-1.5 text-left disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                      state === "done" && "border-success bg-success text-white",
                      state === "current" && "border-brand-blue bg-brand-blue text-white",
                      state === "todo" && "border-input bg-card text-muted-foreground",
                    )}
                  >
                    {state === "done" ? <Check className="size-4" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-medium sm:text-sm",
                      state === "current" ? "text-ink" : "hidden text-muted-foreground sm:inline",
                    )}
                  >
                    {STEP_LABEL[id]}
                  </span>
                </button>
                {i < steps.length - 1 ? <span className="h-px min-w-3 flex-1 bg-border" aria-hidden /> : null}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>

      {step === "details" ? (
        <>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold text-ink">Your details</legend>
            <Text label="Full name" required value={basic.name} error={errors.name} onChange={(v) => setBasic({ ...basic, name: v })} autoComplete="name" />
            <Text
              label="Mobile number"
              required
              value={basic.phone}
              error={errors.phone}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              onChange={(v) => setBasic({ ...basic, phone: v.replace(/\D/g, "").slice(0, 10) })}
            />
            <Text label="Email" value={basic.email} error={errors.email} type="email" autoComplete="email" onChange={(v) => setBasic({ ...basic, email: v })} />
          </fieldset>

          {track.sections.map((section) => (
            <fieldset key={section.title} className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <legend className="mb-2 pt-4 text-sm font-semibold text-ink">{section.title}</legend>
              {section.fields.filter(visible).map((f) =>
                f.type === "select" ? (
                  <SelectField
                    key={f.key}
                    label={f.label}
                    options={fieldOptions(f, { colleges })}
                    value={answers[f.key] ?? ""}
                    onChange={(v) => setAnswers({ ...answers, [f.key]: v })}
                  />
                ) : (
                  <Text
                    key={f.key}
                    label={f.label}
                    hint={f.hint}
                    type={f.type === "date" ? "date" : "text"}
                    inputMode={f.type === "tel" ? "numeric" : undefined}
                    maxLength={f.type === "tel" ? 10 : 120}
                    value={answers[f.key] ?? ""}
                    onChange={(v) => setAnswers({ ...answers, [f.key]: f.type === "tel" ? v.replace(/\D/g, "").slice(0, 10) : v })}
                  />
                ),
              )}
            </fieldset>
          ))}
        </>
      ) : null}

      {step === "payment" && payment ? (
        <UpiPaymentStep
          payment={payment}
          utr={utr}
          onUtrChange={(v) => {
            setUtr(v);
            setErrors((e) => ({ ...e, utr: undefined }));
          }}
          screenshot={screenshot}
          onScreenshotChange={(p) => {
            setScreenshot(p);
            setErrors((e) => ({ ...e, screenshot: undefined }));
          }}
          utrError={errors.utr}
          screenshotError={errors.screenshot}
        />
      ) : null}

      {step === "documents" ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-ink">
            Photo and documents{" "}
            <span className="font-normal text-muted-foreground">(PDF or a clear photo — only our team can see them)</span>
          </p>
          <PhotoUpload value={photo} onChange={setPhoto} />
          {programme.documents.map((document) => {
            const slug = documentSlug(document);
            return (
              <DocumentUpload
                key={slug}
                label={document}
                value={files[slug] ?? ""}
                onChange={(path) => setFiles((prev) => ({ ...prev, [slug]: path }))}
              />
            );
          })}
          {programme.verification ? (
            <div className="mt-2 max-w-sm">
              <SelectField
                label={programme.verification.label}
                options={programme.verification.options}
                value={verification}
                onChange={setVerification}
              />
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Don&apos;t have a document right now? You can continue — our team will collect it later.
          </p>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="grid gap-3">
          <p className="text-sm text-body">Check your details once. Use Edit to change anything, then submit.</p>

          <ReviewBlock title="Basic info" onEdit={() => goTo(steps.indexOf("details"))}>
            <Row label="Name" value={basic.name.trim()} />
            <Row label="Mobile" value={basic.phone} />
            {basic.email.trim() ? <Row label="Email" value={basic.email.trim()} /> : null}
            {filled.map((f) => (
              <Row key={f.key} label={f.label} value={answers[f.key].trim()} />
            ))}
          </ReviewBlock>

          {payment ? (
            <ReviewBlock title="Payment" onEdit={() => goTo(steps.indexOf("payment"))}>
              <Row label="Amount" value={`₹${payment.amount.toLocaleString("en-IN")}`} />
              <Row label="UTR" value={utr.trim().toUpperCase()} />
              <Row label="Screenshot" value={screenshot ? "Attached" : "Missing"} />
            </ReviewBlock>
          ) : null}

          <ReviewBlock title="Documents" onEdit={() => goTo(steps.indexOf("documents"))}>
            <Row label="Photo" value={photo ? "Uploaded" : "Not uploaded"} muted={!photo} />
            {programme.documents.map((d) => (
              <Row key={d} label={d} value={files[documentSlug(d)] ? "Uploaded" : "Not uploaded"} muted={!files[documentSlug(d)]} />
            ))}
            {verification ? <Row label={programme.verification?.label ?? "Verification"} value={verification} /> : null}
          </ReviewBlock>
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={() => goTo(stepIndex - 1)} disabled={busy}>
            <ArrowLeft />
            Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        {step === "review" ? (
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <FileText />
                Submit {programme.code} form
              </>
            )}
          </Button>
        ) : (
          <Button type="submit" size="lg">
            Continue
            <ArrowRight />
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
      </div>
      <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 border-b border-dashed pb-1.5 sm:block sm:border-0 sm:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words text-right font-medium sm:text-left", muted ? "text-muted-foreground" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
} & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
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
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} className="h-10" {...rest} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(FIELD, "bg-card")}>
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
