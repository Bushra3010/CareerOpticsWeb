import { LogIn, Phone } from "lucide-react";

import { HeaderNav } from "@/components/site/header-nav";
import { LoginChooser } from "@/components/site/login-chooser";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/**
 * §5.1 item 2 — logo, the six main links, Login and a red "Call Now" pill,
 * matching the client's header design.
 *
 * Deliberately NOT inside `container-site`: a full-bleed row keeps the logo and
 * the CTA at the window's edges, inset only by the standard gutter.
 *
 * Below `lg` the links collapse: phones navigate with the bottom tab bar and
 * the drawer, and keep Login + a compact Call button here.
 */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 bg-white">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 lg:h-20 lg:px-6">
        <Logo priority showName imageClassName="h-12 w-auto lg:h-16" />

        <HeaderNav />

        <div className="flex items-center gap-2">
          {/* Staff, student and associate sign-in chooser. */}
          <LoginChooser>
            <Button variant="outline">
              <LogIn aria-hidden />
              {/* Icon-only on narrow phones, where the call button needs the room. */}
              <span className="sr-only sm:not-sr-only">Login</span>
            </Button>
          </LoginChooser>

          <a
            href={`tel:${siteConfig.callNow.tel}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-white shadow-card transition-colors hover:bg-brand-red-600 focus-visible:ring-2 focus-visible:ring-brand-blue-400 focus-visible:ring-offset-2 focus-visible:outline-none lg:px-5 lg:py-2.5"
          >
            <Phone className="size-5 shrink-0" aria-hidden />
            <span className="leading-tight">
              <span className="block text-sm font-bold">Call Now</span>
              <span className="hidden text-sm font-bold tabular-nums sm:block">
                {siteConfig.callNow.display}
              </span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
