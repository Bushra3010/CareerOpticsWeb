"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2, Plus } from "lucide-react";

import { saveStudentExam } from "@/app/(crm)/crm/phase2-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STUDENT_EXAM_LABELS, STUDENT_EXAM_TYPES, type StudentExamType } from "@/config/crm";

const CONTROL =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type StudentExam = {
  id: string;
  exam_type: string;
  exam_name: string;
  exam_date: string | null;
  centre: string | null;
  hall_ticket_number: string | null;
  score: string | null;
  is_passed: boolean | null;
  remarks: string | null;
};

function day(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/** Exam attempts and scores for one student — IELTS, PTE, practicals, mocks. */
export function StudentExams({
  studentId,
  exams,
}: {
  studentId: string;
  exams: StudentExam[];
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("student_id", studentId);
    setError(null);

    startTransition(async () => {
      const result = await saveStudentExam(form);
      if (!result.ok) {
        setError(result.error ?? "Could not save the exam.");
        return;
      }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div>
      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exams recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Exams taken by this student</caption>
            <thead className="bg-surface">
              <tr>
                {["Exam", "Date", "Centre", "Score"].map((h) => (
                  <th key={h} scope="col" className="p-2 font-semibold whitespace-nowrap text-ink">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-t align-top">
                  <td className="p-2">
                    <span className="font-medium text-ink">{exam.exam_name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {STUDENT_EXAM_LABELS[exam.exam_type as StudentExamType] ?? exam.exam_type}
                      {exam.hall_ticket_number ? ` · ${exam.hall_ticket_number}` : ""}
                    </span>
                    {exam.remarks ? (
                      <span className="block text-sm text-muted-foreground">{exam.remarks}</span>
                    ) : null}
                  </td>
                  <td className="p-2 whitespace-nowrap tabular-nums text-body">{day(exam.exam_date)}</td>
                  <td className="p-2 text-body">{exam.centre || "—"}</td>
                  <td className="p-2 whitespace-nowrap font-semibold tabular-nums text-ink">
                    {exam.score || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-3 border-t pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="ex-type" className="text-sm">Type</Label>
              <select id="ex-type" name="exam_type" defaultValue="ielts" className={CONTROL}>
                {STUDENT_EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{STUDENT_EXAM_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ex-name" className="text-sm">
                Name<span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input id="ex-name" name="exam_name" required maxLength={160}
                placeholder="IELTS Academic" className="h-9" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ex-date" className="text-sm">Date</Label>
              <Input id="ex-date" name="exam_date" type="date" className="h-9" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ex-centre" className="text-sm">Centre</Label>
              <Input id="ex-centre" name="centre" maxLength={160} className="h-9" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ex-hall" className="text-sm">Hall ticket no.</Label>
              <Input id="ex-hall" name="hall_ticket_number" maxLength={80} className="h-9" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ex-score" className="text-sm">Score</Label>
              <Input id="ex-score" name="score" maxLength={40} placeholder="7.5" className="h-9" />
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="ex-remarks" className="text-sm">Remarks</Label>
            <Input id="ex-remarks" name="remarks" maxLength={500} className="h-9" />
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save exam
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          <Plus />
          Add an exam
        </Button>
      )}
    </div>
  );
}
