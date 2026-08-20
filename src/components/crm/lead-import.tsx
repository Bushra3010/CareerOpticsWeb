"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { CheckCircle2, FileUp, Loader2 } from "lucide-react";

import { commitImport, previewImport } from "@/app/(admin)/admin/crm/import-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CRM_LEAD_SOURCES, CRM_SOURCE_LABELS } from "@/config/crm";
import {
  IMPORT_COLUMNS,
  type ImportPreview,
  type ImportResult,
} from "@/config/crm-import";

const CONTROL =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Three steps: pick a file, confirm the column mapping against a real preview,
 * then commit.
 *
 * The file is never uploaded and stored — it is re-read from the same input on
 * commit. That keeps a spreadsheet of student phone numbers out of Storage
 * entirely.
 */
export function LeadImport() {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setResult(null);
    setError(null);
    setPreview(null);
    if (!file) return;

    const form = new FormData();
    form.set("file", file);

    startTransition(async () => {
      const next = await previewImport(form);
      if (!next.ok) {
        setError(next.error ?? "Could not read that file.");
        return;
      }
      setPreview(next);
    });
  };

  const onCommit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose the file again.");
      return;
    }
    form.set("file", file);
    setError(null);

    startTransition(async () => {
      const next = await commitImport(form);
      if (!next.ok) {
        setError(next.error ?? "Import failed.");
        return;
      }
      setResult(next);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  if (result?.ok) {
    return (
      <div className="max-w-2xl rounded-xl border border-success/30 bg-success/5 p-6">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h2 className="mt-3 text-h3">
          Imported {result.inserted} {result.inserted === 1 ? "lead" : "leads"}
        </h2>
        <ul className="mt-2 grid gap-1 text-body">
          {result.duplicates ? (
            <li>{result.duplicates} already in the CRM, left alone.</li>
          ) : null}
          {result.skipped ? (
            <li>{result.skipped} skipped — no name, or no valid 10-digit number.</li>
          ) : null}
          <li className="text-sm text-muted-foreground">Batch {result.batchId}</li>
        </ul>
        <div className="mt-5 flex gap-3">
          <Button onClick={() => router.push("/admin/crm/leads")}>See the leads</Button>
          <Button variant="ghost" onClick={() => setResult(null)}>Import another file</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border bg-card p-5">
        <Label htmlFor="import-file" className="flex items-center gap-2">
          <FileUp className="size-4 text-brand-blue-400" aria-hidden />
          CSV file
        </Label>
        <input
          ref={fileRef}
          id="import-file"
          type="file"
          accept=".csv,text/csv"
          onChange={onPick}
          disabled={pending}
          className="mt-2 block w-full text-sm text-body file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-blue hover:file:bg-brand-blue-400/15"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Export from Excel with <strong>Save as → CSV UTF-8</strong>. The first
          row must be the column headings. Up to 2,000 rows per file.
        </p>
        {pending && !preview ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Reading…
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {preview?.ok ? (
        <form onSubmit={onCommit} className="mt-6 grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Match the columns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.total} rows found. Name and Phone are required — anything
              left unmatched is ignored.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {IMPORT_COLUMNS.map((column) => (
                <div key={column.key} className="grid gap-1.5">
                  <Label htmlFor={`map-${column.key}`}>
                    {column.label}
                    {column.required ? (
                      <span className="text-destructive" aria-hidden>*</span>
                    ) : null}
                  </Label>
                  <select
                    id={`map-${column.key}`}
                    name={`map_${column.key}`}
                    defaultValue={preview.mapping?.[column.key] ?? ""}
                    className={CONTROL}
                  >
                    <option value="">— ignore —</option>
                    {preview.headers?.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">First few rows</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">Preview of the file</caption>
                <thead className="bg-surface">
                  <tr>
                    {preview.headers?.map((header) => (
                      <th key={header} scope="col" className="p-2 font-semibold whitespace-nowrap text-ink">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows?.map((row, index) => (
                    <tr key={index} className="border-t">
                      {preview.headers?.map((header) => (
                        <td key={header} className="p-2 whitespace-nowrap text-body">
                          {row[header] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">How to file them</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="import-source">Source</Label>
                <select id="import-source" name="source" defaultValue="excel_import" className={CONTROL}>
                  {CRM_LEAD_SOURCES.map((source) => (
                    <option key={source} value={source}>{CRM_SOURCE_LABELS[source]}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-start gap-2 pt-7">
                <input type="checkbox" name="assign_to_me" className="mt-0.5 size-4 accent-brand-blue" />
                <span className="text-sm text-body">
                  Assign all of them to me
                </span>
              </label>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Numbers already in the CRM are skipped, so re-importing a corrected
              file will not duplicate anyone.
            </p>
          </section>

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Import {preview.total} rows
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
