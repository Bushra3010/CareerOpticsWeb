"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { SalarySlip } from "@/components/crm/salary-slip";

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

export function SalarySlipViewer({
  slip,
  employee,
}: {
  slip: PayrollRow;
  employee: EmployeeRow;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Slip"}
      </Button>
      {open ? (
        <div className="mt-3">
          <SalarySlip slip={slip} employee={employee} />
        </div>
      ) : null}
    </div>
  );
}
