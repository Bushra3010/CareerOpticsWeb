import Link from "next/link";

import { Compass, Home, Search } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { siteConfig, telHref } from "@/config/site";

/**
 * 404 — PRD §11.
 *
 * A dead end on a lead-gen site is a lost enquiry, so this offers the three
 * things a student who mistyped a URL actually wants: search, the finder, or a
 * phone number. Rendered without the site chrome because it also catches
 * `/admin` misses, where the header would be wrong.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-16 text-center">
      <Logo />

      <p className="mt-10 font-display text-h1 text-brand-blue-400 tabular-nums">404</p>
      <h1 className="mt-2 text-h2">We could not find that page</h1>
      <p className="mt-3 max-w-md text-pretty text-body">
        The link may be old, or the college or course may have moved. Try a
        search, or let a counsellor point you at the right one.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/college-finder">
            <Compass />
            Find my college
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/colleges">
            <Search />
            Browse colleges
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/">
            <Home />
            Home
          </Link>
        </Button>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Or call{" "}
        <a href={telHref} className="font-semibold text-brand-blue-400 hover:underline">
          {siteConfig.phoneDisplay}
        </a>{" "}
        — a counsellor will find it for you.
      </p>
    </main>
  );
}
