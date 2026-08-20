import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CRM_STUDENT_STATUSES,
  CRM_STUDENT_STATUS_LABELS,
  type CrmStudentStatus,
} from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import { getCrmOptions, listCrmStudents } from "@/lib/queries/crm";
import { formatInr } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Students",
  robots: { index: false, follow: false },
};

const CONTROL =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function CrmStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const params = await searchParams;
  const [{ students, total, page, pageCount }, options] = await Promise.all([
    listCrmStudents({ ...params, page: params.page ? Number(params.page) : 1 }),
    getCrmOptions(),
  ]);

  const pending = students.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h2">Students</h1>
          <p className="mt-1 text-body">
            <span className="font-semibold text-ink tabular-nums">{total}</span>{" "}
            {total === 1 ? "student" : "students"}
            {pending > 0 ? ` · ${pending} waiting for approval on this page` : ""}
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="grid gap-1.5">
          <label htmlFor="s-q" className="text-sm font-medium text-ink">Search</label>
          <input id="s-q" name="q" defaultValue={params.q ?? ""}
            placeholder="Name, phone or enrollment no."
            className={`${CONTROL} w-[240px]`} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="s-status" className="text-sm font-medium text-ink">Status</label>
          <select id="s-status" name="status" defaultValue={params.status ?? ""} className={`${CONTROL} w-[180px]`}>
            <option value="">All</option>
            {CRM_STUDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CRM_STUDENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="s-course" className="text-sm font-medium text-ink">Course</label>
          <select id="s-course" name="course" defaultValue={params.course ?? ""} className={`${CONTROL} w-[170px]`}>
            <option value="">All courses</option>
            {options.courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Apply</Button>
        {params.q || params.status || params.course ? (
          <Button asChild variant="ghost"><Link href="/admin/crm/students">Clear</Link></Button>
        ) : null}
      </form>

      {students.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-h3">No students match</h2>
          <p className="mt-1 text-body">
            A student is created automatically when a lead is marked converted.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption className="sr-only">Students</caption>
            <thead className="bg-surface">
              <tr>
                {["Enrollment", "Student", "Course", "Session", "Fee", "Status"].map((h) => (
                  <th key={h} scope="col" className="p-3 font-semibold text-ink">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const outstanding =
                  Math.max(0, Number(student.total_fee ?? 0) - Number(student.amount_paid ?? 0));
                return (
                  <tr key={student.id} className="border-t align-top">
                    <td className="p-3 whitespace-nowrap tabular-nums">
                      <Link
                        href={`/admin/crm/students/${student.id}`}
                        className="font-semibold text-ink hover:text-brand-blue"
                      >
                        {student.enrollment_number}
                      </Link>
                    </td>
                    <td className="p-3">
                      {student.full_name}
                      <span className="block text-muted-foreground tabular-nums">
                        {student.phone}
                      </span>
                    </td>
                    <td className="max-w-[180px] p-3">
                      {student.course?.name ?? <span className="text-muted-foreground">—</span>}
                      {student.sub_course?.name ? (
                        <span className="block text-muted-foreground">{student.sub_course.name}</span>
                      ) : null}
                    </td>
                    <td className="p-3">{student.session?.name ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap tabular-nums">
                      {student.total_fee ? (
                        <>
                          <span className="font-medium text-ink">
                            {formatInr(student.amount_paid) ?? "₹0"}
                          </span>
                          <span className="text-muted-foreground"> / {formatInr(student.total_fee)}</span>
                          {outstanding > 0 ? (
                            <span className="block text-brand-orange">
                              {formatInr(outstanding)} due
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          student.status === "active" ? "success"
                          : student.status === "pending" ? "urgent"
                          : "outline"
                        }
                        size="sm"
                      >
                        {CRM_STUDENT_STATUS_LABELS[student.status as CrmStudentStatus] ?? student.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <p className="mt-6 text-sm text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </p>
      ) : null}
    </div>
  );
}
