"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

import { deleteRow, setVisibility } from "@/app/(admin)/admin/[section]/actions";
import { Button } from "@/components/ui/button";
import type { VisibilityKind } from "@/config/admin-content";

/** Publish / unpublish / delete for one content row (§5.5). */
export function ContentRowActions({
  section,
  id,
  label,
  visibility,
  visible,
}: {
  section: string;
  id: string;
  label: string;
  visibility: VisibilityKind | null;
  visible: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const run = (
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>,
    extra?: Record<string, string>,
    confirmMessage?: string,
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formData = new FormData();
    formData.set("section", section);
    formData.set("id", id);
    for (const [key, value] of Object.entries(extra ?? {})) {
      formData.set(key, value);
    }
    setError(null);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      router.refresh();
    });
  };

  const toggleValue =
    visibility === "status"
      ? visible
        ? "draft"
        : "published"
      : visible
        ? "false"
        : "true";

  return (
    <div className="flex items-center justify-end gap-1">
      {visibility ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(setVisibility, { value: toggleValue })}
          title={visible ? "Unpublish" : "Publish"}
        >
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : visible ? (
            <EyeOff />
          ) : (
            <Eye />
          )}
          {visible ? "Unpublish" : "Publish"}
        </Button>
      ) : null}

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() =>
          run(
            deleteRow,
            undefined,
            `Delete “${label}”? This cannot be undone.`,
          )
        }
        title="Delete"
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete {label}</span>
      </Button>

      {error ? (
        <span role="alert" className="text-sm font-medium text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}
