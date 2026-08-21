"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Check, ExternalLink, Loader2 } from "lucide-react";

import { saveStudentDocument } from "@/app/(crm)/crm/phase2-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STUDENT_DOC_LABELS,
  STUDENT_DOC_STATUSES,
  STUDENT_DOC_STATUS_LABELS,
  STUDENT_DOC_TYPES,
  type StudentDocStatus,
  type StudentDocType,
} from "@/config/crm";

const CONTROL =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type StudentDocument = {
  id: string;
  doc_type: string;
  status: string;
  file_url: string | null;
  notes: string | null;
};

const TONE: Record<StudentDocStatus, string> = {
  pending: "bg-surface text-muted-foreground",
  received: "bg-brand-blue-50 text-brand-blue",
  verified: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

/**
 * The document checklist, rendered from the eleven types the table's CHECK
 * allows rather than from the rows that happen to exist — a counsellor needs to
 * see what is still missing, which a list of collected documents cannot show.
 *
 * `crm.student_documents` is unique on (student_id, doc_type) and the action
 * upserts on that pair, so a row is created the first time a type is touched.
 */
export function StudentDocuments({
  studentId,
  documents,
  canEdit = true,
}: {
  studentId: string;
  documents: StudentDocument[];
  canEdit?: boolean;
}) {
  const byType = new Map(documents.map((d) => [d.doc_type, d]));
  const collected = documents.filter((d) => d.status === "verified").length;

  return (
    <div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {collected} of {STUDENT_DOC_TYPES.length} verified
      </p>
      <ul className="mt-3 grid gap-2">
        {STUDENT_DOC_TYPES.map((type) => (
          <DocumentRow
            key={type}
            studentId={studentId}
            type={type}
            document={byType.get(type)}
            canEdit={canEdit}
          />
        ))}
      </ul>
    </div>
  );
}

function DocumentRow({
  studentId,
  type,
  document,
  canEdit = true,
}: {
  studentId: string;
  type: StudentDocType;
  document?: StudentDocument;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const status = (document?.status ?? "pending") as StudentDocStatus;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("student_id", studentId);
    form.set("doc_type", type);
    setError(null);

    startTransition(async () => {
      const result = await saveStudentDocument(form);
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {status === "verified" ? (
            <Check className="size-4 shrink-0 text-success" aria-hidden />
          ) : (
            <span className="size-4 shrink-0 rounded-full border" aria-hidden />
          )}
          {STUDENT_DOC_LABELS[type]}
        </span>

        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${TONE[status]}`}>
            {STUDENT_DOC_STATUS_LABELS[status]}
          </span>
          {document?.file_url ? (
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue-400 hover:underline"
              aria-label={`Open ${STUDENT_DOC_LABELS[type]}`}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? "Cancel" : "Update"}
            </Button>
          ) : null}
        </span>
      </div>

      {document?.notes && !open ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{document.notes}</p>
      ) : null}

      {open ? (
        <form onSubmit={submit} className="mt-3 grid gap-2 border-t pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor={`st-${type}`} className="text-sm">Status</Label>
              <select id={`st-${type}`} name="status" defaultValue={status} className={CONTROL}>
                {STUDENT_DOC_STATUSES.map((s) => (
                  <option key={s} value={s}>{STUDENT_DOC_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`url-${type}`} className="text-sm">File link</Label>
              <Input
                id={`url-${type}`}
                name="file_url"
                type="url"
                inputMode="url"
                placeholder="https://…"
                defaultValue={document?.file_url ?? ""}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`nt-${type}`} className="text-sm">Note</Label>
            <Input
              id={`nt-${type}`}
              name="notes"
              defaultValue={document?.notes ?? ""}
              placeholder="Original seen, photocopy taken…"
              className="h-9"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending} className="justify-self-start">
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </form>
      ) : null}
    </li>
  );
}
