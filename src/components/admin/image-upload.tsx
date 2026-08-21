"use client";

import Image from "next/image";
import * as React from "react";

import { ImageUp, Loader2, X } from "lucide-react";

import {
  ALLOWED_IMAGE_TYPES,
  isUploadBucket,
  MAX_UPLOAD_BYTES,
} from "@/config/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadBucket } from "@/config/storage";
import { imageSrc } from "@/lib/media";

/**
 * Image field for the admin forms (§5.5 "CRUD + image upload").
 *
 * Uploads immediately on pick and stores the resulting **public URL** in a
 * hidden input, so the surrounding form only ever submits a string. The URL is
 * also editable by hand — some images live outside Storage, and an editor
 * should not be forced to re-upload one that is already hosted.
 */
export function ImageUpload({
  name,
  bucket,
  defaultValue,
  label,
}: {
  name: string;
  bucket: UploadBucket;
  defaultValue?: string | null;
  label: string;
}) {
  const [url, setUrl] = React.useState(defaultValue ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldId = React.useId();

  // A seeded `/seed/...` path has no file behind it, so it must not render.
  const preview = imageSrc(url);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("bucket", bucket);

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = (await response.json()) as {
        ok: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.url) {
        setError(result.error ?? "Upload failed.");
        return;
      }
      setUrl(result.url);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUploading(false);
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>

      {/* What the form actually submits. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border bg-surface">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <ImageUp className="size-6" aria-hidden />
            </span>
          )}
        </div>

        <div className="grid min-w-[240px] flex-1 gap-2">
          <input
            ref={inputRef}
            id={fieldId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            className="block w-full text-sm text-body file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-blue hover:file:bg-brand-blue-400/15"
          />

          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="…or paste an image URL"
            aria-label={`${label} URL`}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />

          <div className="flex items-center gap-3">
            {uploading ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Uploading…
              </span>
            ) : null}
            {url && !uploading ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUrl("")}
                className="h-auto p-0 text-destructive"
              >
                <X className="size-3.5" />
                Remove
              </Button>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
