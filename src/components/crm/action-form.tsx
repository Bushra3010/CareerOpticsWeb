"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Result = { ok: boolean; error?: string };
type Action = (formData: FormData) => Promise<Result>;

const CONTROL =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "email" | "tel" | "url" | "textarea" | "select" | "checkbox" | "hidden";
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | number | null;
  step?: string;
  min?: string;
  /** Full width in the two-column grid. */
  wide?: boolean;
  help?: string;
};

/**
 * One form driven by a field list, posting to a Server Action.
 *
 * Every phase-2 module needs "a handful of inputs and a submit button", and
 * fourteen bespoke client components is fourteen chances for the error
 * handling to drift. Native inputs rather than the Radix equivalents for the
 * same reason the P11 filter panel uses them: they work before hydration and
 * cost nothing in the bundle.
 */
export function ActionForm({
  action,
  fields,
  submitLabel = "Save",
  hidden,
  onDone,
  resetOnSuccess = true,
  columns = 2,
}: {
  action: Action;
  fields: FieldSpec[];
  submitLabel?: string;
  hidden?: Record<string, string>;
  onDone?: () => void;
  resetOnSuccess?: boolean;
  columns?: 1 | 2;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    for (const [key, value] of Object.entries(hidden ?? {})) form.set(key, value);

    setError(null);
    setDone(false);

    startTransition(async () => {
      const result = await action(form);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      if (resetOnSuccess) formRef.current?.reset();
      setDone(true);
      onDone?.();
      router.refresh();
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
      <div className={columns === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
        {fields.map((field) => (
          <Field key={field.name} field={field} disabled={pending} wide={columns === 1} />
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {done && !error ? (
        <p role="status" className="text-sm font-medium text-success">
          Saved.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  field,
  disabled,
  wide,
}: {
  field: FieldSpec;
  disabled: boolean;
  wide: boolean;
}) {
  const id = `f-${field.name}`;
  const type = field.type ?? "text";

  if (type === "hidden") {
    return <input type="hidden" name={field.name} defaultValue={field.defaultValue ?? ""} />;
  }

  const span = field.wide || wide || type === "textarea" ? "sm:col-span-2" : "";

  if (type === "checkbox") {
    return (
      <label className={`flex items-center gap-2 text-sm text-ink ${span}`}>
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(field.defaultValue)}
          disabled={disabled}
          className="size-4 rounded border-input accent-brand-blue"
        />
        {field.label}
      </label>
    );
  }

  return (
    <div className={`grid gap-1.5 ${span}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {field.label}
        {field.required ? (
          <span className="text-destructive" aria-hidden>
            {" "}*
          </span>
        ) : null}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          required={field.required}
          disabled={disabled}
          rows={3}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue ?? ""}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        />
      ) : type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          disabled={disabled}
          defaultValue={field.defaultValue ?? ""}
          className={CONTROL}
        >
          {!field.required ? <option value="">—</option> : null}
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={field.name}
          type={type}
          required={field.required}
          disabled={disabled}
          step={field.step}
          min={field.min}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue ?? ""}
          className={CONTROL}
        />
      )}

      {field.help ? (
        <p className="text-sm text-muted-foreground">{field.help}</p>
      ) : null}
    </div>
  );
}
