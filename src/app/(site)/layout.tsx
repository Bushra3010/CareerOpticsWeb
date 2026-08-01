import { DeferredToaster } from "@/components/site/deferred-toaster";
import { MobileStickyBar } from "@/components/site/mobile-sticky-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

/** Public site shell — PRD §4. */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* pb-14 keeps the mobile sticky bar from covering the last section */}
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
      <MobileStickyBar />
      <DeferredToaster />
    </div>
  );
}
