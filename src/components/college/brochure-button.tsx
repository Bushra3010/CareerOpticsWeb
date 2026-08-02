"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

const BrochureDialog = dynamic(
  () =>
    import("@/components/college/brochure-dialog").then((m) => m.BrochureDialog),
  { ssr: false },
);

/**
 * §5.3 — "Download Brochure", gated by phone. The gate itself lives in
 * `/api/brochure`: the lead is stored first and the response carries a
 * 60-second signed URL.
 */
export function BrochureButton({
  collegeId,
  collegeName,
  variant = "outline",
}: {
  collegeId: string;
  collegeName: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
      >
        <Download />
        Brochure
      </Button>
      {loaded ? (
        <BrochureDialog
          open={open}
          onOpenChange={setOpen}
          collegeId={collegeId}
          collegeName={collegeName}
        />
      ) : null}
    </>
  );
}
