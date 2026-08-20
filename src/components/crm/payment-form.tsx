"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Loader2 } from "lucide-react";

import { recordPayment } from "@/app/(crm)/crm/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_MODES } from "@/config/crm";

const CONTROL =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Record a fee payment against a student and move their running total. */
export function PaymentForm({
  studentId,
  outstanding,
}: {
  studentId: string;
  outstanding: number;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("student_id", studentId);
    setError(null);

    startTransition(async () => {
      const result = await recordPayment(form);
      if (!result.ok) {
        setError(result.error ?? "Could not record the payment.");
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="pay-amount">
            Amount (₹)<span className="text-destructive" aria-hidden>*</span>
          </Label>
          <Input
            id="pay-amount"
            name="amount"
            type="number"
            step="any"
            min="1"
            required
            // Pre-filling what is still owed is the common case; it stays editable.
            defaultValue={outstanding > 0 ? outstanding : ""}
            className="h-10"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pay-mode">Mode</Label>
          <select id="pay-mode" name="payment_mode" defaultValue="upi" className={CONTROL}>
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pay-date">
            Date<span className="text-destructive" aria-hidden>*</span>
          </Label>
          <Input
            id="pay-date"
            name="payment_date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="h-10"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pay-receipt">Receipt no.</Label>
          <Input id="pay-receipt" name="receipt_number" className="h-10" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="pay-notes">Notes</Label>
        <Input id="pay-notes" name="notes" placeholder="First instalment" className="h-10" />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? <Loader2 className="animate-spin" /> : null}
        Record payment
      </Button>
    </form>
  );
}
