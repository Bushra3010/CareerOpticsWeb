import { BrochureButton } from "@/components/college/brochure-button";
import { CompareToggle } from "@/components/college/compare-toggle";
import { LeadDialog } from "@/components/forms/lead-dialog";
import { Button } from "@/components/ui/button";
import type { College } from "@/lib/queries/college-detail";

/**
 * §5.3 action bar: Apply Now · Download Brochure · Compare · Ask a Question.
 *
 * Not sticky on its own — it sits directly above the sticky tab nav, which is
 * the element that stays pinned. Two stacked sticky bars would eat a third of
 * a 3G Android viewport.
 */
export function CollegeActionBar({ college }: { college: College }) {
  const shortName = college.short_name ?? college.name;

  return (
    <div className="container-site flex flex-wrap items-center gap-2 py-4">
      <LeadDialog
        source="college_detail"
        collegeId={college.id}
        title={`Apply to ${shortName}`}
        description="A counsellor will confirm eligibility, fees and the next admission date."
        fields={["email", "city", "level", "admission", "message"]}
        submitLabel="Submit Application"
      >
        <Button size="lg">Apply Now</Button>
      </LeadDialog>

      {/* Only rendered once a brochure has actually been uploaded (§5.3). */}
      {college.brochure_url ? (
        <BrochureButton collegeId={college.id} collegeName={shortName} />
      ) : null}

      <LeadDialog
        source="college_detail"
        collegeId={college.id}
        title={`Ask about ${shortName}`}
        description="Cut-offs, hostel, scholarships — ask anything and a counsellor will answer."
        fields={["city", "message"]}
        submitLabel="Send Question"
      >
        <Button variant="outline">Ask a Question</Button>
      </LeadDialog>

      <div className="ml-auto">
        <CompareToggle
          college={{ id: college.id, name: shortName, slug: college.slug }}
        />
      </div>
    </div>
  );
}
