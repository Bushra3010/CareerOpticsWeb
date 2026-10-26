import { CallbackWidget } from "@/components/forms/callback-widget";
import { QuickEnquiryModal } from "@/components/forms/quick-enquiry-modal";
import { CookieConsent } from "@/components/site/cookie-consent";
import { DeferredToaster } from "@/components/site/deferred-toaster";
import { MobileMenuProvider } from "@/components/site/mobile-menu";
import { MobileTabBar } from "@/components/site/mobile-tab-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { offices } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { getLeadFormOptions } from "@/lib/queries/leads";
import { JsonLd, organizationSchema, webSiteSchema } from "@/lib/seo/json-ld";

import "../globals.css";

/** Public site shell — PRD §4. */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The quick enquiry modal offers a university and course, so its options are
  // fetched once here rather than per page.
  const leadOptions = await getLeadFormOptions();

  return (
    // Provider wraps the shell so the header's account button and the bottom
    // bar's Profile tab open the same drawer.
    <MobileMenuProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        {/* pb-16 keeps the mobile tab bar from covering the last section */}
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <SiteFooter />
        <WhatsAppFab />
        <CallbackWidget />
        <MobileTabBar />
        <QuickEnquiryModal options={leadOptions} />
        <CookieConsent />
        <DeferredToaster />
        {/* §10 — site-level graph, emitted once for every page. */}
        <JsonLd data={organizationSchema(siteConfig, offices[0]?.address ?? "")} />
        <JsonLd data={webSiteSchema(siteConfig)} />
      </div>
    </MobileMenuProvider>
  );
}
