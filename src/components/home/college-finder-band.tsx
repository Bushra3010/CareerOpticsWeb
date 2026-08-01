import Link from "next/link";

import { Clock, ListChecks, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const STEPS = [
  { icon: ListChecks, label: "6 quick questions" },
  { icon: Clock, label: "Under 2 minutes" },
  { icon: Sparkles, label: "Free shortlist" },
];

/**
 * §5.1 item 8. The blue→red gradient is the signature element and §6.1 allows
 * it here and on heading underlines only.
 */
export function CollegeFinderBand() {
  return (
    <section className="bg-brand-gradient py-12 text-white lg:py-16">
      <div className="container-site flex flex-wrap items-center justify-between gap-8">
        <div>
          <h2 className="text-h2 text-white">Find a college in 2 minutes</h2>
          <p className="mt-2 max-w-xl text-pretty text-white/80">
            Answer six quick questions and get a shortlist matched to your
            marks, budget and preferred city — reviewed by a counsellor, free.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {STEPS.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm text-white/90">
                <step.icon className="size-4 shrink-0" aria-hidden />
                {step.label}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild size="xl" variant="inverse">
          <Link href="/college-finder">Start College Finder</Link>
        </Button>
      </div>
    </section>
  );
}
