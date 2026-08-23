"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { offices } from "@/config/nav";

const COMPANY = {
  name: "CareerOptics Education Service",
  tagline: "Your career. Our guidance.",
  address: offices[0]?.address ?? "",
  phone: siteConfig.phoneDisplay,
  email: siteConfig.supportEmail,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-border pb-1 mb-2">
        {title}
      </h3>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-ink ${mono ? "tabular-nums" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export function PaymentInvoice({
  payment,
  student,
}: {
  payment: {
    id: string;
    amount: number;
    payment_mode: string;
    payment_date: string;
    receipt_number: string | null;
    notes: string | null;
    created_at: string;
  };
  student: {
    full_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
}) {
  const handlePrint = () => window.print();

  const paidWords = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(payment.amount);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
          Print invoice
        </Button>
      </div>

      <div
        data-print-area
        className="print-area max-w-[210mm] mx-auto bg-white text-ink rounded-xl border border-border p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b-2 border-brand-blue">
          <div className="flex items-center gap-3">
            <img src="/logo-full.png" alt="" className="h-12 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-ink">{COMPANY.name}</h1>
              <p className="text-xs text-muted-foreground">{COMPANY.tagline}</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{COMPANY.address}</p>
            <p>{COMPANY.phone}</p>
            <p>{COMPANY.email}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-brand-blue mb-6">
          PAYMENT RECEIPT
        </h2>

        {/* Receipt meta */}
        <div className="flex justify-between text-sm mb-6">
          <div>
            <p className="text-muted-foreground">Receipt No.</p>
            <p className="font-semibold tabular-nums">{payment.receipt_number ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Date</p>
            <p className="font-semibold tabular-nums">{new Date(payment.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        {/* Student info */}
        <Section title="Student Details">
          <Row label="Name" value={student.full_name} />
          <Row label="Phone" value={student.phone ?? "—"} />
          {student.email ? <Row label="Email" value={student.email} /> : null}
          {student.address ? <Row label="Address" value={student.address} /> : null}
        </Section>

        {/* Payment info */}
        <Section title="Payment Details">
          <Row label="Amount paid" value={paidWords} mono />
          <Row label="Mode" value={payment.payment_mode.toUpperCase()} />
          <Row label="Recorded on" value={new Date(payment.created_at).toLocaleString("en-IN")} />
          {payment.notes ? <Row label="Notes" value={payment.notes} /> : null}
        </Section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>Thank you for your payment. For queries, call {COMPANY.phone} or email {COMPANY.email}.</p>
          <p className="mt-1">This is a system-generated receipt. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
