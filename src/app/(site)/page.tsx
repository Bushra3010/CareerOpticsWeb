import { MessageCircle, Phone, Search } from "lucide-react";

import { siteConfig, telHref, whatsappHref } from "@/config/site";

/**
 * P0 placeholder home. Proves fonts, brand tokens and layout primitives render.
 * Replaced section-by-section in P3 (PRD §5.1).
 */
export default function HomePage() {
  return (
    <>
      {/* 1. Utility top bar (§5.1) */}
      <div className="hidden h-9 items-center bg-brand-blue-900 text-white lg:flex">
        <div className="container-site flex items-center justify-end gap-6 text-sm">
          <a
            href={telHref}
            className="flex items-center gap-1.5 hover:text-brand-amber"
          >
            <Phone className="size-3.5" aria-hidden />
            {siteConfig.phone}
          </a>
          <a
            href={whatsappHref("Hi CareerOptics, I need admission guidance.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-brand-amber"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            WhatsApp
          </a>
          <span className="text-brand-amber">Free Counselling</span>
        </div>
      </div>

      {/* 2. Header (§5.1) */}
      <header className="sticky top-0 z-40 h-16 border-b bg-white shadow-card">
        <div className="container-site flex h-16 items-center justify-between gap-6">
          <Wordmark />
          <div className="hidden flex-1 items-center gap-2 rounded-lg border px-3 py-2 md:flex">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">
              Search for colleges, exams, courses and more..
            </span>
          </div>
          <span className="text-sm font-semibold text-brand-orange">
            Select Goal &amp; City
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero (§5.1 item 4) */}
        <section className="bg-brand-blue-900 py-16 text-center text-white lg:py-24">
          <div className="container-site">
            <h1 className="text-h1 lg:text-h1-lg text-balance text-white">
              Find Your Right College in 2 Minutes
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-white/80">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#"
                className="rounded-lg bg-brand-red px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-red-600"
              >
                Need Counselling
              </a>
              <a
                href="#"
                className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore Colleges
              </a>
            </div>
          </div>
        </section>

        {/* Build status — temporary, removed in P3 */}
        <section className="py-12 lg:py-16">
          <div className="container-site">
            <h2 className="heading-underline text-h2">Phase P0 complete</h2>
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
          </div>
        </section>

        {/* College Finder band — the signature gradient (§6.1) */}
        <section className="bg-brand-gradient py-12 text-white lg:py-16">
          <div className="container-site flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-h2 text-white">
                Find a college in 2 minutes
              </h2>
              <p className="mt-1 text-white/80">
                Answer 6 quick questions and get a shortlist matched to your
                marks, budget and city.
              </p>
            </div>
            <span className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-blue">
              Coming in P8
            </span>
          </div>
        </section>
      </main>

      <footer className="bg-brand-blue-900 py-8 text-white/70">
        <div className="container-site flex flex-wrap items-center justify-between gap-4 text-sm">
          <Wordmark inverted />
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="font-display text-h3 tracking-tight">
      <span className={inverted ? "text-white" : "text-brand-blue"}>
        Career
      </span>
      <span className={inverted ? "text-brand-amber" : "text-brand-red"}>
        Optics
      </span>
    </span>
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
    scope: "Supabase migration, RLS policies, storage buckets, seed data.",
    done: false,
  },
  {
    id: "P2",
    title: "Design system",
    scope: "UI primitives, SiteHeader, SiteFooter, /style-guide page.",
    done: false,
  },
] as const;
