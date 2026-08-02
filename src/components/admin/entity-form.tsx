"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { saveRow } from "@/app/(admin)/admin/[section]/actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Field } from "@/config/admin-fields";

export type SelectOptions = Record<string, { value: string; label: string }[]>;

const CONTROL = "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const AREA = "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Create/edit form for any content section — PRD §5.5.
 *
 * Driven entirely by `config/admin-fields.ts`, so a new column is one line of
 * config rather than a new page. The server action re-validates every field
 * against the same config; nothing here is trusted.
 */
export function EntityForm({
  section,
  fields,
  row,
  optionsFrom,
  cancelHref,
}: {
  section: string;
  fields: Field[];
  /** Absent when creating. */
  row?: Record<string, unknown> | null;
  optionsFrom: SelectOptions;
  cancelHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("section", section);
    if (row?.id) formData.set("id", String(row.id));

    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveRow(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        setFieldErrors(result.fields ?? {});
        return;
      }
      router.push(cancelHref);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-5">
      {fields.map((field) => (
        <FieldControl
          key={field.name}
          field={field}
          value={row?.[field.name]}
          options={field.optionsFrom ? (optionsFrom[field.optionsFrom] ?? []) : field.options ?? []}
          error={fieldErrors[field.name]}
        />
      ))}

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 border-t pt-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : row?.id ? (
            "Save changes"
          ) : (
            "Create"
          )}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          disabled={pending}
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FieldControl({
  field,
  value,
  options,
  error,
}: {
  field: Field;
  value: unknown;
  options: { value: string; label: string }[];
  error?: string;
}) {
  const id = React.useId();

  // Postgres hands back arrays, dates and numbers — normalise to what an
  // <input> can actually hold.
  const text =
    value == null
      ? ""
      : Array.isArray(value)
        ? value.join(", ")
        : field.kind === "date" && typeof value === "string"
          ? value.slice(0, 10)
          : String(value);

  if (field.kind === "image") {
    return (
      <div>
        <ImageUpload
          name={field.name}
          bucket={field.bucket ?? "gallery"}
          defaultValue={text}
          label={field.label}
        />
        {field.help ? <Help text={field.help} /> : null}
        {error ? <FieldError text={error} /> : null}
      </div>
    );
  }

  if (field.kind === "boolean") {
    return (
      <div className="flex items-start gap-3">
        {/* The hidden input makes an unchecked box submit "false" rather than
            nothing at all, so the action can tell false from untouched. */}
        <input type="hidden" name={field.name} value="false" />
        <input
          id={id}
          type="checkbox"
          name={field.name}
          value="true"
          defaultChecked={value === true}
          className="mt-0.5 size-4 accent-brand-blue"
        />
        <span>
          <Label htmlFor={id}>{field.label}</Label>
          {field.help ? <Help text={field.help} /> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>

      {field.kind === "select" ? (
        <select id={id} name={field.name} defaultValue={text} className={CONTROL}>
          <option value="">— none —</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.kind === "textarea" ? (
        <textarea id={id} name={field.name} defaultValue={text} rows={3} className={AREA} />
      ) : field.kind === "richtext" ? (
        <textarea id={id} name={field.name} defaultValue={text} rows={10} className={`${AREA} font-mono`} />
      ) : (
        <Input
          id={id}
          name={field.name}
          defaultValue={text}
          placeholder={field.placeholder}
          type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
          step={field.kind === "number" ? "any" : undefined}
          className="h-10"
        />
      )}

      {field.help ? <Help text={field.help} /> : null}
      {error ? <FieldError text={error} /> : null}
    </div>
  );
}

function Help({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function FieldError({ text }: { text: string }) {
  return <p className="text-sm font-medium text-destructive">{text}</p>;
}
