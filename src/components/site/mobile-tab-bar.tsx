"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BookOpen, Building2, Home, User, UsersRound } from "lucide-react";

import { LeadDialog } from "@/components/forms/lead-dialog";
import { useMobileMenu } from "@/components/site/mobile-menu";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Colleges", href: "/colleges", icon: Building2 },
  { label: "Courses", href: "/courses", icon: BookOpen },
] as const;

/**
 * Mobile bottom tab bar (§5.1 floating UI).
 *
 * "Counselling" is the accent slot and opens the lead form rather than routing
 * anywhere — it keeps the site's primary mobile conversion in the bar now that
 * the Call/WhatsApp/Apply trio has moved into the drawer.
 *
 * "Profile" opens that drawer: there is no student login in v1 (§3, deferred to
 * §18), so rather than a dead control it is the account/more surface, holding
 * the full navigation plus Call and WhatsApp.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const openMenu = useMobileMenu();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgb(15_23_42/0.08)] lg:hidden"
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
              active ? "text-brand-blue" : "text-muted-foreground",
            )}
          >
            <tab.icon
              className={cn("size-5", active && "fill-brand-blue/15")}
              aria-hidden
            />
            {tab.label}
          </Link>
        );
      })}

      <LeadDialog
        source="apply_now"
        title="Get free counselling"
        description="Share your details and a counsellor will call you with the colleges that fit."
        fields={["city", "level"]}
        submitLabel="Request Callback"
      >
        <button
          type="button"
          className="flex flex-col items-center gap-1 py-2 text-[11px] font-semibold text-brand-red"
        >
          <UsersRound className="size-5" aria-hidden />
          Counselling
        </button>
      </LeadDialog>

      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="dialog"
        className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground"
      >
        <User className="size-5" aria-hidden />
        Profile
      </button>
    </nav>
  );
}
