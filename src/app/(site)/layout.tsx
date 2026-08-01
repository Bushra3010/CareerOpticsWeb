import { CallbackWidget } from "@/components/forms/callback-widget";
import { QuickEnquiryModal } from "@/components/forms/quick-enquiry-modal";
import { DeferredToaster } from "@/components/site/deferred-toaster";
import { MobileStickyBar } from "@/components/site/mobile-sticky-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { getLeadFormOptions } from "@/lib/queries/leads";

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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* pb-14 keeps the mobile sticky bar from covering the last section */}
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
      <CallbackWidget />
      <MobileStickyBar />
      <QuickEnquiryModal options={leadOptions} />
      <DeferredToaster />
    </div>
  );
}
