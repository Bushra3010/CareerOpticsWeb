import Link from "next/link";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { Button } from "@/components/ui/button";
import {
  TEACHING_PROGRAMMES,
  type TeachingProgramme,
} from "@/config/teaching-programmes";

/**
 * The D.El.Ed / B.Ed band that sits between the hero and the study goals.
 *
 * The layout follows the reference the user supplied — a white card with a
 * ringed badge straddling its top edge and the actions in a row along the
 * bottom. The colour does not: the reference is green, and §6.1 puts primary
 * CTAs on brand-red with an outline-blue secondary, which is also the exact
 * hierarchy these two buttons need.
 *
 * A Server Component. Only `LeadDialog` is a client leaf, and it is already in
 * the home page's graph via `CollegeCard`, so this band costs no new
 * First Load JS — the form itself still downloads on the first Apply click.
 */
export function TeachingProgrammes() {
  return (
    <section
      id="teaching-programmes"
      aria-labelledby="teaching-programmes-title"
      className="bg-surface py-12 lg:py-16"
    >
      <div className="container-site">
        <div className="max-w-2xl">
          <h2 id="teaching-programmes-title" className="heading-underline text-h2">
            Teacher Training{" "}
            <span className="text-brand-blue-400">Admissions</span>
          </h2>
          <p className="mt-4 text-pretty text-body">
            Applications for Uttar Pradesh D.El.Ed and B.Ed run through our
            counsellors. Check what you need, then apply — there is no fee to
            enquire.
          </p>
        </div>

        {/* The badge overhangs its card by 36px, so the top padding clears the
            description above and the row gap keeps it off the card above once
            the grid stacks on phones. */}
        <ul className="mt-8 grid gap-x-6 gap-y-16 pt-10 sm:grid-cols-2">
          {TEACHING_PROGRAMMES.map((programme) => (
            <li key={programme.code}>
              <ProgrammeCard programme={programme} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProgrammeCard({ programme }: { programme: TeachingProgramme }) {
  return (
    <article className="card-lift relative flex h-full flex-col rounded-xl border bg-card px-6 pt-14 pb-6">
      <span
        aria-hidden
        className="absolute -top-9 left-1/2 flex size-18 -translate-x-1/2 items-center justify-center rounded-full border-4 border-brand-blue bg-card px-1 text-center font-display text-sm font-extrabold tracking-tight text-brand-blue"
      >
        {programme.code}
      </span>

      <h3 className="text-h3 text-center">{programme.name}</h3>
      <p className="mt-2 text-center text-pretty text-body">
        {programme.description}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/courses/${programme.courseSlug}`}>
            About {programme.code}
          </Link>
        </Button>
        <LeadDialog
          source="teaching_admission"
          title={`Apply for ${programme.name}`}
          description="Fill in your details and a counsellor will call you to complete the application."
          fields={["email", "guardian", "documents"]}
          checklist={programme}
          level={programme.level}
          submitLabel={`Apply for ${programme.code}`}
        >
          <Button>Apply for {programme.code}</Button>
        </LeadDialog>
      </div>
    </article>
  );
}
