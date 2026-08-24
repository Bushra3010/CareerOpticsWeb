import { LeadDialog } from "@/components/forms/lead-dialog";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

/**
 * §5.1 item 2, stripped to the two things that matter: the mark and the CTA.
 *
 * Deliberately NOT inside `container-site`. That utility is capped at 1280px
 * and centred, so on a wider window it leaves a margin either side and the two
 * ends would sit well inside the frame. A full-bleed row keeps the logo and the
 * CTA at the window's edges, inset only by the standard gutter.
 *
 * Everything else that used to live here was removed, and nothing is stranded:
 *  - search is in `MobileQuickStart` on phones and on `/search`
 *  - phone and WhatsApp are in the footer, the mobile drawer and the callback
 *    widget
 *  - navigation is the course chip bar, the mobile bottom tab bar and the
 *    footer, which is the crawlable copy
 */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 h-16 bg-white">
      {/* Full-bleed, but with the standard site gutter so neither end is
          jammed against the window edge. */}
      <div className="flex h-16 w-full items-center justify-between px-4 lg:px-6">
        <Logo priority />

        <LeadDialog
          source="contact"
          title="Get free counselling"
          description="Tell us what you are looking for and a counsellor will call you back."
          fields={["city", "level", "message"]}
        >
          <Button className="bg-brand-blue hover:bg-brand-blue-900">
            <span className="hidden sm:inline">Need&nbsp;</span>Counselling
          </Button>
        </LeadDialog>
      </div>
    </header>
  );
}
