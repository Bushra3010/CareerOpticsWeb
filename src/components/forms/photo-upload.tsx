"use client";

import Image from "next/image";
import * as React from "react";

import { Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/config/storage";

/**
 * Passport-size photograph on the Apply form — the paper form's "Affix recent
 * Passport Size Photograph" box.
 *
 * Uploads on pick to /api/upload/photo and hands the caller a storage path,
 * not a URL: the bucket is private, so there is nothing publicly linkable. The
 * local preview is an object URL, revoked when it is replaced or unmounted.
 */
export function PhotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (path: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = async (file: File) => {
    if (busy) return;
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Photo must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return objectUrl;
    });
    setBusy(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/photo", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; path?: string; error?: string };

      if (!response.ok || !result.ok || !result.path) {
        setError(result.error ?? "Upload failed. Try again.");
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return null;
        });
        return;
      }
      onChange(result.path);
    } catch {
      setError("Upload failed. Check your connection and try again.");
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-ink">
        Passport-size photo{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </span>

      <div className="flex items-center gap-3">
        <div className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-white">
          {preview ? (
            // Object URL of a file the visitor just picked — next/image cannot
            // optimise a blob: URL, so this stays a plain img.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <Image
              src="/logo.webp"
              alt=""
              width={40}
              height={40}
              className="opacity-20"
            />
          ) : (
            <Upload className="size-5 text-muted-foreground" aria-hidden />
          )}
          {busy ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-brand-blue" aria-hidden />
            </span>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            id="applicant-photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pick(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "Change photo" : "Upload photo"}
            </Button>
            {value ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clear}
                disabled={busy}
              >
                <Trash2 />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP or AVIF, up to{" "}
            {MAX_UPLOAD_BYTES / 1024 / 1024} MB. Only our counsellors can see it.
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {value && !error ? (
        <p className="text-sm text-success">Photo uploaded.</p>
      ) : null}
    </div>
  );
}
