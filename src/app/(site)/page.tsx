import Link from "next/link";

import { CourseChipNav } from "@/components/site/course-chip-nav";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/**
 * P0–P2 placeholder home. Sections 4–17 of §5.1 are built in P3.
 */
export default function HomePage() {
  return (
    <>
      <div className="relative">
        <section className="bg-brand-blue-900 py-16 text-center text-white lg:py-24">
          <div className="container-site">
            <h1 className="text-h1 lg:text-h1-lg text-balance text-white">
              Find Your Right College in 2 Minutes
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-white/80">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl">
                <Link href="/contact">Need Counselling</Link>
              </Button>
              <Button asChild size="xl" variant="inverse">
                <Link href="/colleges">Explore Colleges</Link>
              </Button>
            </div>
          </div>
        </section>
        <CourseChipNav />
      </div>

      <section className="py-12 lg:py-16">
        <div className="container-site">
          <h2 className="heading-underline text-h2">Build progress</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {phases.map((phase) => (
              <article
                key={phase.id}
                className="card-lift rounded-xl border bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue-50 px-2.5 py-0.5 text-sm font-semibold text-brand-blue">
                    {phase.id}
                  </span>
                  {phase.done ? (
                    <span className="text-sm font-semibold text-success">
                      Done
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-h3">{phase.title}</h3>
                <p className="mt-1 text-body">{phase.scope}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-body">
            Every component is on the{" "}
            <Link
              href="/style-guide"
              className="font-semibold text-brand-blue-400 underline underline-offset-4"
            >
              style guide
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-brand-gradient py-12 text-white lg:py-16">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-h2 text-white">Find a college in 2 minutes</h2>
            <p className="mt-1 text-white/80">
              Answer 6 quick questions and get a shortlist matched to your
              marks, budget and city.
            </p>
          </div>
          <Button asChild size="xl" variant="inverse">
            <Link href="/college-finder">Start College Finder</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

const phases = [
  {
    id: "P0",
    title: "Foundation",
    scope: "Next.js 15, Tailwind v4, shadcn/ui, fonts, brand tokens, env.",
    done: true,
  },
  {
    id: "P1",
    title: "Database",
    scope: "Supabase migrations, RLS policies, storage buckets, seed data.",
    done: true,
  },
  {
    id: "P2",
    title: "Design system",
    scope: "UI primitives, site header and footer, /style-guide page.",
    done: true,
  },
  {
    id: "P3",
    title: "Home sections",
    scope: "Hero carousel, study goals, top universities, exams, FAQs.",
    done: false,
  },
] as const;
