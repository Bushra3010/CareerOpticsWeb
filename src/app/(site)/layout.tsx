/**
 * Public site shell — PRD §4.
 * SiteHeader / CourseChipNav / SiteFooter / MobileStickyBar / WhatsAppFab
 * are built in P2 and mounted here.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
