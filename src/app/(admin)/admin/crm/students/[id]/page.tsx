import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft, MessageCircle, Phone } from "lucide-react";

import { PaymentForm } from "@/components/crm/payment-form";
import { StudentStatusSelect } from "@/components/crm/student-status-select";
import { Button } from "@/components/ui/button";
import { type CrmStudentStatus } from "@/config/crm";
import { can, requireStaff } from "@/lib/auth";
import { getCrmStudent, getStudentPayments } from "@/lib/queries/crm";
import { formatInr } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student",
  robots: { index: false, follow: false },
};

function day(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export default async function CrmStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const { id } = await params;
  const student = await getCrmStudent(id);
  if (!student) notFound();

  const payments = await getStudentPayments(id);
  const total = Number(student.total_fee ?? 0);
  const paid = Number(student.amount_paid ?? 0);
  const outstanding = Math.max(0, total - paid);
  const dial = student.phone.replace(/\D/g, "");

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Enrollment", value: student.enrollment_number },
    { label: "Phone", value: student.phone },
    { label: "Email", value: student.email || "—" },
    { label: "City", value: student.city || "—" },
    { label: "Father", value: student.father_name || "—" },
    {
      label: "Guardian",
      value:
        [student.guardian_name, student.guardian_phone].filter(Boolean).join(" · ") || "—",
    },
    { label: "Course", value: student.course?.name ?? "—" },
    { label: "Specialisation", value: student.sub_course?.name ?? "—" },
    { label: "Session", value: student.session?.name ?? "—" },
    { label: "Department", value: student.department?.name ?? "—" },
    { label: "Mode", value: student.mode ?? "—" },
    { label: "Enrolled", value: day(student.enrollment_date) },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/crm/students">
          <ArrowLeft />
          Back to students
        </Link>
      </Button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h2">{student.full_name}</h1>
          <p className="mt-1 text-body tabular-nums">
            {student.enrollment_number} · {student.phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={`tel:${student.phone}`}><Phone />Call</a>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://wa.me/${dial.length === 10 ? `91${dial}` : dial}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
          <StudentStatusSelect id={student.id} status={student.status as CrmStudentStatus} />
        </div>
      </div>

      {student.status === "pending" ? (
        <p className="mt-4 rounded-lg border border-brand-orange/30 bg-brand-orange/10 p-3 text-sm text-ink">
          This student came from a converted lead and is waiting for approval.
          Set the status to <strong>Active</strong> once the admission is confirmed.
        </p>
      ) : null}

      {student.status === "dropped" && student.drop_reason ? (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-ink">
          <strong>Dropped:</strong> {student.drop_reason}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Details</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 break-words text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {student.lead_id ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Converted from{" "}
                <Link
                  href={`/admin/crm/leads/${student.lead_id}`}
                  className="font-medium text-brand-blue-400 hover:underline"
                >
                  the original lead
                </Link>
                .
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Payments</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing recorded yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <caption className="sr-only">Payments for {student.full_name}</caption>
                  <thead className="bg-surface">
                    <tr>
                      {["Date", "Amount", "Mode", "Receipt", "Notes"].map((h) => (
                        <th key={h} scope="col" className="p-3 font-semibold text-ink">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-t align-top">
                        <td className="p-3 whitespace-nowrap tabular-nums">
                          {day(payment.payment_date)}
                        </td>
                        <td className="p-3 font-semibold text-ink tabular-nums">
                          {formatInr(Number(payment.amount))}
                        </td>
                        <td className="p-3 uppercase">{payment.payment_mode}</td>
                        <td className="p-3 tabular-nums">{payment.receipt_number ?? "—"}</td>
                        <td className="p-3 text-body">{payment.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Fees</h2>
            <dl className="mt-4 grid gap-3">
              <Money label="Total fee" value={total} />
              <Money label="Paid" value={paid} tone="success" />
              <Money label="Outstanding" value={outstanding} tone={outstanding > 0 ? "urgent" : undefined} />
            </dl>

            {total > 0 ? (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-brand-blue-50">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${Math.min(100, (paid / total) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {Math.round(Math.min(100, (paid / total) * 100))}% collected
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-h3">Record a payment</h2>
            <div className="mt-4">
              <PaymentForm studentId={student.id} outstanding={outstanding} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "urgent";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "success"
            ? "font-semibold text-success tabular-nums"
            : tone === "urgent"
              ? "font-semibold text-brand-orange tabular-nums"
              : "font-semibold text-ink tabular-nums"
        }
      >
        {formatInr(value) ?? "₹0"}
      </dd>
    </div>
  );
}
