"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";

type Result = { ok: boolean; error?: string };
type Action = (formData: FormData) => Promise<Result>;

/**
 * A select that posts one field to a Server Action on change.
 *
 * Optimistic: the new value shows immediately and reverts if the write is
 * refused, so a manager-only action failing for a telecaller reads as a
 * refusal rather than a control that silently sprang back.
 */
export function ActionSelect({
  action,
  name,
  value,
  options,
  hidden,
  label,
  confirmOn,
  confirmPrompt,
  confirmField,
  width = 170,
}: {
  action: Action;
  name: string;
  value: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  hidden?: Record<string, string>;
  label: string;
  /** Values that must collect a reason before the write. */
  confirmOn?: string[];
  confirmPrompt?: string;
  confirmField?: string;
  width?: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState(value);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setCurrent(value), [value]);

  const onChange = (next: string) => {
    const previous = current;
    let reason = "";

    if (confirmOn?.includes(next)) {
      const typed = window.prompt(confirmPrompt ?? "Add a note");
      if (!typed?.trim()) return;
      reason = typed.trim();
    }

    setCurrent(next);
    setError(null);

    startTransition(async () => {
      const form = new FormData();
      form.set(name, next);
      for (const [k, v] of Object.entries(hidden ?? {})) form.set(k, v);
      if (reason && confirmField) form.set(confirmField, reason);

      const result = await action(form);
      if (!result.ok) {
        setCurrent(previous);
        setError(result.error ?? "That did not work.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid gap-1">
      <select
        value={current}
        disabled={pending}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        style={{ width: `${width}px` }}
        className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** A button that posts a fixed payload to a Server Action. */
export function ActionButton({
  action,
  payload,
  children,
  variant = "outline",
  size = "sm",
  confirm,
}: {
  action: Action;
  payload: Record<string, string>;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "default";
  confirm?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onClick = () => {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);

    startTransition(async () => {
      const form = new FormData();
      for (const [k, v] of Object.entries(payload)) form.set(k, v);
      const result = await action(form);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <span className="inline-grid gap-1">
      <Button type="button" variant={variant} size={size} disabled={pending} onClick={onClick}>
        {children}
      </Button>
      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}

/** Wraps a form in a details/summary so a page can offer "Add" without a modal. */
export function Disclosure({
  label,
  children,
  open,
}: {
  label: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded-xl border bg-card">
      <summary className="cursor-pointer list-none p-4 font-semibold text-ink marker:content-none">
        {label}
      </summary>
      <div className="border-t p-4">{children}</div>
    </details>
  );
}
