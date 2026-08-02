"use client";

import { Download } from "lucide-react";

import { LeadForm } from "@/components/forms/lead-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The brochure gate's modal. Reuses `LeadForm` pointed at `/api/brochure`,
 * which stores the lead and returns a 60-second signed URL — surfaced in the
 * thank-you card rather than auto-downloaded, so the visitor stays in control.
 */
export function BrochureDialog({
  open,
  onOpenChange,
  collegeId,
  collegeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeId: string;
  collegeName: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-h3">Download brochure</DialogTitle>
          <DialogDescription>
            Enter your number to get the {collegeName} brochure with the full
            fee structure.
          </DialogDescription>
        </DialogHeader>

        <LeadForm
          source="brochure"
          endpoint="/api/brochure"
          collegeId={collegeId}
          fields={["email"]}
          submitLabel="Get Brochure"
          successExtra={(result) =>
            result.url ? (
              <>
                <Button asChild className="w-full">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <Download />
                    Download brochure
                  </a>
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  This link expires in {result.expiresIn ?? 60} seconds. Reopen
                  this form if it runs out.
                </p>
              </>
            ) : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
