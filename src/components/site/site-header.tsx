import Link from "next/link";

import { Bell, ChevronDown, Grid3x3, MessageCircle, Phone, Search } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { siteConfig, telHref, whatsappHref } from "@/config/site";

/**
 * §5.1 items 1–2. Server-rendered; MobileNav is the only client leaf.
 * The functional GoalCitySelector and MegaSearch land in P3 — the header
 * currently renders their static shells so the layout is final.
 */
export function SiteHeader() {
  return (
    <>
      {/* 1. Utility top bar — desktop only, h-9, brand-blue-900 */}
      <div className="hidden h-9 bg-brand-blue-900 text-white lg:block">
        <div className="container-site flex h-9 items-center justify-end gap-6 text-sm">
          <a
            href={telHref}
            className="flex items-center gap-1.5 hover:text-brand-amber"
          >
            <Phone className="size-3.5" aria-hidden />
            {siteConfig.phoneDisplay}
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
          <Link href="/contact" className="font-semibold text-brand-amber hover:underline">
            Free Counselling
          </Link>
        </div>
      </div>

      {/* 2. Sticky header — h-16, white, shadow appears on scroll */}
      <header className="site-header sticky top-0 z-40 h-16 bg-white">
        <div className="container-site flex h-16 items-center gap-4">
          <Logo priority />

          {/* Goal & city selector (P3 makes it a real dropdown) */}
          <button
            type="button"
            className="hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none xl:flex"
          >
            Select Goal &amp; City
            <ChevronDown className="size-4" aria-hidden />
          </button>

          {/* Mega search (P3 wires it to /api/search) */}
          <form action="/search" className="hidden flex-1 md:block">
            <label htmlFor="site-search" className="sr-only">
              Search colleges, exams and courses
            </label>
            <div className="flex h-10 items-center gap-2 rounded-lg border px-3 focus-within:border-brand-blue-400 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Search for colleges, exams, courses and more.."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/colleges"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue-50 lg:block"
            >
              Write a Review
            </Link>
            <Button variant="ghost" size="icon" aria-label="Explore" className="hidden lg:inline-flex">
              <Grid3x3 className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden lg:inline-flex">
              <Bell className="size-5" />
            </Button>
            <Button asChild className="hidden lg:inline-flex">
              <Link href="/contact">Need Counselling</Link>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
