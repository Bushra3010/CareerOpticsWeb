import { Headset } from "lucide-react";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { Button } from "@/components/ui/button";

/**
 * §5.2 — injected after every 6th listing result. Uses the `college_detail`
 * source so these leads are distinguishable from a specific Apply Now.
 */
export function InlineLeadCard() {
  return (
    <aside className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-blue/20 bg-brand-blue-50 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-blue">
        <Headset className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-h3">Not sure which college?</h3>
        <p className="mt-1 text-body">
          Tell us your marks, budget and preferred city. A counsellor will
          shortlist the colleges you can actually get into — free.
        </p>
      </div>
      <LeadDialog
        source="college_detail"
        title="Get free counselling"
        description="Share a few details and a counsellor will call you within 24 hours."
        fields={["city", "level", "message"]}
      >
        <Button size="lg">Get Free Counselling</Button>
      </LeadDialog>
    </aside>
  );
}
