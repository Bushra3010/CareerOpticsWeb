"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Client leaf so the style guide itself can stay a Server Component. */
export function ToastDemo() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast.success("Enquiry submitted", {
          description: "A counsellor will call you within 24 hours.",
        })
      }
    >
      Show toast
    </Button>
  );
}
