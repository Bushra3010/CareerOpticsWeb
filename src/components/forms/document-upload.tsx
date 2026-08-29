"use client";

import * as React from "react";

import { Check, FileText, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_DOCUMENT_BYTES } from "@/config/storage";

/**
 * One optional marksheet attachment on the Apply form.
 *
 * Uploads on pick to /api/upload/document and hands the caller a storage path,
 * not a URL — the bucket is private, so there is nothing publicly linkable.
 * No preview is rendered: unlike the passport photo there is nothing to check
 * visually, and painting a student's marksheet across the screen in a shop or
 * a classroom is worse than showing a filename.
 */
export function DocumentUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputId = React.useId();

  const pick = async (file: File) => {
    if (busy) return;
    setError(null);

    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`Must be under ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB.`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/document", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as {
        ok: boolean;
        path?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.path) {
        setError(result.error ?? "Upload failed. Try again.");
        return;
      }
      setFileName(file.name);
      onChange(result.path);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFileName(null);
    onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="grid gap-1.5 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {value ? (
            <Check className="size-4 text-success" aria-hidden />
          ) : (
            <FileText className="size-4 text-muted-foreground" aria-hidden />
          )}
          {label}
        </span>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pick(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant={value ? "ghost" : "outline"}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload />
                {value ? "Replace" : "Upload"}
              </>
            )}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              disabled={busy}
              aria-label={`Remove ${label}`}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-brand-red">
          {error}
        </p>
      ) : value ? (
        <p className="text-xs text-success">
          Uploaded{fileName ? ` — ${fileName}` : ""}
        </p>
      ) : null}
    </div>
  );
}
