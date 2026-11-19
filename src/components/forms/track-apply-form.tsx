"use client";

import * as React from "react";

import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";

import { DocumentUpload } from "@/components/forms/document-upload";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { type PaymentStep, UpiPaymentStep, UTR_PATTERN } from "@/components/forms/upi-payment-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentSlug } from "@/config/admission-form";
import { findProgramme, type TrackField } from "@/config/admission-tracks";
import { siteConfig, whatsappHref } from "@/config/site";
import { cn } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

/**
 * The public form behind a counsellor's link for the Student Credit Card,
 * Distance and NIOS / BBOSE tracks (B.Ed / D.El.Ed keeps the website
 * `LeadForm`). Fields and documents come from `config/admission-tracks.ts`;
 * everything posts to `/api/leads` inside `answers`, and the bridge files the
 * lead under the track and the link creator.
 */
export function TrackApplyForm({
  programmeCode,
  linkCode,
  payment,
}: {
  programmeCode: string;
  linkCode: string;
  payment?: PaymentStep;
}) {
  const found = findProgramme(programmeCode);
  const [basic, setBasic] = React.useState({ name: "", phone: "", email: "" });
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [photo, setPhoto] = React.useState("");
  const [files, setFiles] = React.useState<Record<string, string>>({});
  const [utr, setUtr] = React.useState("");
  const [screenshot, setScreenshot] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const hp = React.useRef<HTMLInputElement>(null);

  if (!found) return null;
  const { track, programme } = found;

  const visible = (f: TrackField) => !f.showIf || f.showIf.values.includes(answers[f.showIf.key] ?? "");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const next: Record<string, string | undefined> = {
      name: basic.name.trim().length >= 2 ? undefined : "Enter your full name",
      phone: /^[6-9]\d{9}$/.test(basic.phone) ? undefined : "Enter a 10-digit mobile number starting with 6-9",
      email: !basic.email || /^\S+@\S+\.\S+$/.test(basic.email) ? undefined : "Enter a valid email address",
    };
    if (payment) {
      next.utr = UTR_PATTERN.test(utr.trim()) ? undefined : "Enter the UTR / transaction ID shown in your UPI app after paying.";
      next.screenshot = screenshot ? undefined : "Attach a screenshot of the payment.";
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      setFormError("Please check the highlighted fields.");
      return;
    }

    const payload: Record<string, string> = { ref: linkCode, programme: programme.name, track: track.category };
    for (const f of track.sections.flatMap((s) => s.fields)) {
      const v = answers[f.key]?.trim();
      if (v && visible(f)) payload[f.key] = v.slice(0, 200);
    }
    if (photo) payload.photo_path = photo;
    for (const [slug, path] of Object.entries(files)) if (path) payload[`file_${slug}`.slice(0, 40)] = path;
    const ready = programme.documents.filter((d) => files[documentSlug(d)]);
    if (ready.length) payload.documents_ready = ready.join(", ").slice(0, 200);
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
    } catch {
      setFormError(`We could not reach the server. Please call ${siteConfig.phoneDisplay} instead.`);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-5" role="status" aria-live="polite">
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
                options={f.options ?? []}
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

      <div className="grid gap-2 border-t pt-4">
        <p className="text-sm font-semibold text-ink">
          Photo and documents <span className="font-normal text-muted-foreground">(PDF or a clear photo — only our team can see them)</span>
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
      </div>

      {payment ? (
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

      {formError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="animate-spin" />
            Sending…
          </>
        ) : (
          `Submit ${programme.code} form`
        )}
      </Button>
    </form>
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
