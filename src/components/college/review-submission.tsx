"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

const ReviewForm = dynamic(
  () => import("@/components/college/review-form").then((m) => m.ReviewForm),
  { ssr: false },
);

/**
 * Most visitors on a college page are reading, not reviewing, so the review
 * form is behind a disclosure: the form and its validation only download when
 * someone actually intends to write (§11). Once opened it stays open.
 */
export function ReviewSubmission({
  collegeId,
  collegeName,
}: {
  collegeId: string;
  collegeName: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (open) {
    return <ReviewForm collegeId={collegeId} collegeName={collegeName} />;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed p-5">
      <p className="text-body">
        Studied at {collegeName}? Tell the next student what it is really like.
      </p>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PenLine />
        Write a review
      </Button>
    </div>
  );
}
