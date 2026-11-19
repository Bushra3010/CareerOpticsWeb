"use client";

import * as React from "react";

import { Check, Copy, IndianRupee, Smartphone } from "lucide-react";

import { DocumentUpload } from "@/components/forms/document-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Built on the server by `/apply/[code]` — see `lib/queries/admission-links.ts`. */
export type PaymentStep = {
  amount: number;
  upiId: string | null;
  payeeName: string | null;
  /** `upi://pay?...&am=<amount>` — null when the office set only a QR image. */
  upiUri: string | null;
  /** QR as a data URL (amount encoded) or the office's uploaded QR image. */
  qrSrc: string | null;
  /** False for an uploaded QR: the student has to type the amount. */
  qrHasAmount: boolean;
  instructions: string | null;
};

export const UTR_PATTERN = /^[A-Za-z0-9]{6,30}$/;

/**
 * The fee step on an admission link: scan / tap to pay the exact amount by
 * UPI, then hand back the UTR and a screenshot. There is no gateway — the
 * office checks the UTR against its bank statement in the CRM.
 */
export function UpiPaymentStep({
  payment,
  utr,
  onUtrChange,
  screenshot,
  onScreenshotChange,
  utrError,
  screenshotError,
}: {
  payment: PaymentStep;
  utr: string;
  onUtrChange: (value: string) => void;
  screenshot: string;
  onScreenshotChange: (path: string) => void;
  utrError?: string;
  screenshotError?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const utrId = React.useId();
  const amount = `₹${payment.amount.toLocaleString("en-IN")}`;

  const copy = () => {
    if (!payment.upiId) return;
    navigator.clipboard.writeText(payment.upiId).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };

  return (
    <fieldset className="grid gap-4 rounded-xl border border-brand-blue/20 bg-brand-blue-50/50 p-4">
      <legend className="sr-only">Pay the form fee</legend>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Pay the form fee</p>
          <p className="text-sm text-body">Pay by any UPI app: Google Pay, PhonePe, Paytm, BHIM.</p>
        </div>
        <p className="flex items-center font-display text-h3 font-bold text-brand-blue tabular-nums">
          <IndianRupee className="size-5" aria-hidden />
          {payment.amount.toLocaleString("en-IN")}
        </p>
      </div>

      <div className={payment.qrSrc ? "grid items-center gap-4 sm:grid-cols-[176px_1fr]" : "grid gap-4"}>
        {payment.qrSrc ? (
          <div className="mx-auto rounded-lg border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL / storage URL, nothing for next/image to optimise */}
            <img
              src={payment.qrSrc}
              alt={`UPI QR code to pay ${amount}`}
              width={160}
              height={160}
              className="size-40"
            />
          </div>
        ) : null}

        <div className="grid gap-2.5 text-sm text-body">
          {!payment.qrSrc && !payment.upiId ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
              Ask your counsellor for the UPI ID or QR code, pay {amount}, then fill in the UTR and screenshot below.
            </p>
          ) : null}
          <p className={!payment.qrSrc ? "hidden" : undefined}>
            {payment.qrHasAmount
              ? `Scan this QR in your UPI app — ${amount} is already filled in.`
              : `Scan this QR in your UPI app and enter ${amount}.`}
          </p>
          {payment.upiUri ? (
            <Button asChild className="sm:hidden">
              <a href={payment.upiUri}>
                <Smartphone />
                Pay {amount} in UPI app
              </a>
            </Button>
          ) : null}
          {payment.upiId ? (
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">
                  UPI ID{payment.payeeName ? ` · ${payment.payeeName}` : ""}
                </span>
                <span className="block truncate font-mono font-semibold text-ink">{payment.upiId}</span>
              </span>
              <Button type="button" size="sm" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
          {payment.instructions ? <p className="text-muted-foreground">{payment.instructions}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 border-t border-brand-blue/15 pt-4">
        <p className="text-sm font-semibold text-ink">After paying, fill these in</p>
        <div className="grid gap-1.5">
          <Label htmlFor={utrId}>
            UTR / UPI transaction ID
            <span className="text-destructive" aria-hidden>*</span>
          </Label>
          <Input
            id={utrId}
            value={utr}
            onChange={(e) => onUtrChange(e.target.value.replace(/\s+/g, ""))}
            inputMode="text"
            autoComplete="off"
            maxLength={30}
            placeholder="12-digit number from your UPI app"
            aria-invalid={Boolean(utrError)}
            className="h-10 bg-white"
          />
          {utrError ? <p className="text-sm font-medium text-destructive">{utrError}</p> : null}
        </div>
        <div className="grid gap-1.5">
          <DocumentUpload label="Payment screenshot *" value={screenshot} onChange={onScreenshotChange} />
          {screenshotError ? (
            <p className="text-sm font-medium text-destructive">{screenshotError}</p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
