import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

import { TrackApplyForm } from "@/components/forms/track-apply-form";
import type { PaymentStep } from "@/components/forms/upi-payment-step";
import { findProgramme } from "@/config/admission-tracks";
import { TEACHING_PROGRAMMES } from "@/config/teaching-programmes";
import {
  getAdmissionLink,
  getCollegeNames,
  getUpiPaymentSettings,
  upiPayUri,
} from "@/lib/queries/admission-links";

// Links can be switched off from the CRM at any time — never serve a cached copy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admission Form",
  robots: { index: false, follow: false },
};

/**
 * `/apply/[code]` — the admission form a counsellor shares from the CRM, for
 * any track. Every track uses the stepped `TrackApplyForm` (basic info →
 * payment → documents → review → submit). The `ref` answer tells
 * the CRM bridge whose lead it is, so the submission lands with that
 * counsellor, and `track` files it under the right category.
 */
export default async function AdmissionLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const link = await getAdmissionLink(code);
  const found = link ? findProgramme(link.programme) : null;
  if (!link || !found) notFound();
  const { programme, track } = found;
  const teaching = TEACHING_PROGRAMMES.find((p) => p.code === programme.code);
  const needsColleges = track.sections.some((s) => s.fields.some((f) => f.optionsFrom === "colleges"));
  const colleges = needsColleges ? await getCollegeNames() : [];

  // Payment step: only when the link carries a fee and the office has set a
  // UPI ID or uploaded a QR. The QR is generated here, on the server, with the
  // amount filled in — scanning it opens the UPI app ready to pay that sum.
  let payment: PaymentStep | undefined;
  if (link.amount) {
    const upi = await getUpiPaymentSettings();
    const upiUri = upi.upiId
      ? upiPayUri(upi.upiId, upi.payeeName, link.amount, `${programme.code} admission ${link.code}`)
      : null;
    const qrSrc = upiUri
      ? await QRCode.toDataURL(upiUri, { margin: 1, width: 480, errorCorrectionLevel: "M" })
      : upi.qrImageUrl;
    if (upiUri || qrSrc) {
      payment = {
        amount: link.amount,
        upiId: upi.upiId,
        payeeName: upi.payeeName,
        upiUri,
        qrSrc,
        qrHasAmount: Boolean(upiUri),
        instructions: upi.instructions,
      };
    }
  }

  return (
    <div className="bg-surface">
      <div className="container-site max-w-3xl py-8 lg:py-12">
        <div className="rounded-2xl border bg-card p-5 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-brand-blue-400">Admission form</p>
          <h1 className="mt-1 text-h2">{programme.name} Admission</h1>
          <p className="mt-2 text-body">{programme.description}</p>
          {link.amount ? (
            <p className="mt-3 inline-flex rounded-lg bg-brand-blue-50 px-3 py-1.5 text-sm font-semibold text-brand-blue tabular-nums">
              Form fee: ₹{link.amount.toLocaleString("en-IN")}
            </p>
          ) : null}

          <ul className="mt-4 grid gap-1.5 text-sm text-body sm:grid-cols-2">
            {programme.documents.map((document) => (
              <li key={document} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {document}
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-blue-50 p-3 text-sm text-body">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden />
            Your documents are stored privately and seen only by our admission team.
          </p>

          <TrackApplyForm
            programmeCode={programme.code}
            linkCode={link.code}
            payment={payment}
            colleges={colleges}
            level={teaching?.level}
          />
        </div>
      </div>
    </div>
  );
}
