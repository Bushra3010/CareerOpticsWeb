"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { PaymentInvoice } from "@/components/crm/payment-invoice";

type Payment = {
  id: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
};

type Student = {
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export function PaymentInvoiceViewer({
  payment,
  student,
}: {
  payment: Payment;
  student: Student;
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
        {open ? "Hide" : "Invoice"}
      </Button>
      {open ? (
        <div className="mt-3">
          <PaymentInvoice payment={payment} student={student} />
        </div>
      ) : null}
    </div>
  );
}
