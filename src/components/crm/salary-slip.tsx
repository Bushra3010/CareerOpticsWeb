"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { offices } from "@/config/nav";
import { formatInr } from "@/lib/media";
import { PAYROLL_STATUS_LABELS } from "@/config/crm";

const COMPANY = {
  name: "CareerOptics Education Service",
  tagline: "Your career. Our guidance.",
  address: offices[0]?.address ?? "",
  phone: siteConfig.phoneDisplay,
  email: siteConfig.supportEmail,
};

type PayrollRow = {
  id: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  incentive: number;
  gross: number;
  pf: number;
  tds: number;
  other_deductions: number;
  advance_deduction: number;
  net: number;
  status: string;
  payment_date: string | null;
};

type EmployeeRow = {
  id: string;
  employee_code: string;
  full_name: string | null;
};

export function SalarySlip({
  slip,
  employee,
}: {
  slip: PayrollRow;
  employee: EmployeeRow;
}) {
  const handlePrint = () => window.print();

  const monthName = new Date(slip.year, slip.month - 1).toLocaleString("en-IN", { month: "long" });

  const earnings = [
    { label: "Basic Salary", value: slip.basic },
    { label: "HRA", value: slip.hra },
    { label: "Allowances", value: slip.allowances },
    { label: "Incentive", value: slip.incentive },
  ];

  const deductions = [
    { label: "Provident Fund (PF)", value: slip.pf },
    { label: "TDS", value: slip.tds },
    { label: "Other Deductions", value: slip.other_deductions },
    ...(slip.advance_deduction > 0
      ? [{ label: "Advance Deduction", value: slip.advance_deduction }]
      : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
          Print salary slip
        </Button>
      </div>

      <div
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

        <h2 className="text-xl font-bold text-center text-brand-blue mb-1">
          SALARY SLIP
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-6">
          {monthName} {slip.year}
        </p>

        {/* Employee info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Employee</p>
            <p className="font-semibold">{employee.full_name ?? "—"}</p>
            <p className="text-muted-foreground">{employee.employee_code}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Slip ID</p>
            <p className="font-semibold tabular-nums">{slip.id.slice(0, 8).toUpperCase()}</p>
            {slip.payment_date ? (
              <>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mt-2 mb-1">Paid on</p>
                <p className="tabular-nums">
                  {new Date(slip.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {/* Salary breakdown */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-brand-blue/30 pb-1 mb-2">
              Earnings
            </h3>
            {earnings.map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-1.5 text-sm border-b border-border/30"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{formatInr(item.value) ?? "₹0"}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 mt-1 font-bold text-sm border-t-2 border-brand-blue">
              <span>Gross</span>
              <span className="tabular-nums">{formatInr(slip.gross) ?? "₹0"}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue border-b border-brand-blue/30 pb-1 mb-2">
              Deductions
            </h3>
            {deductions.map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-1.5 text-sm border-b border-border/30"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{formatInr(item.value) ?? "₹0"}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 mt-1 font-bold text-sm border-t-2 border-brand-blue">
              <span>Total Deductions</span>
              <span className="tabular-nums">
                {formatInr(slip.pf + slip.tds + slip.other_deductions + slip.advance_deduction) ?? "₹0"}
              </span>
            </div>
          </div>
        </div>

        {/* Net payable */}
        <div className="bg-brand-blue-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-bold text-brand-blue">Net Payable</span>
            <span className="text-xl font-bold text-brand-blue tabular-nums">
              {formatInr(slip.net) ?? "₹0"}
            </span>
          </div>
        </div>

        {/* Status & footer */}
        <div className="flex items-center justify-between">
          <Badge variant={slip.status === "paid" ? "success" : slip.status === "processed" ? "default" : "outline"}>
            {PAYROLL_STATUS_LABELS[slip.status as keyof typeof PAYROLL_STATUS_LABELS] ?? slip.status}
          </Badge>
          <p className="text-xs text-muted-foreground">
            Generated by {COMPANY.name}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>{COMPANY.address} | {COMPANY.phone} | {COMPANY.email}</p>
          <p className="mt-1">This is a system-generated salary slip. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
