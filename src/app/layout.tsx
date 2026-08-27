import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

import { offices } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { JsonLd, organizationSchema, webSiteSchema } from "@/lib/seo/json-ld";

import "./globals.css";

/**
 * Montserrat carries both roles — headings and body — matching the reference
 * site, which sets it as its single `--body-font`.
 *
 * No `weight` array on purpose: that pulls the variable font, so one file
 * covers 400 through 800 instead of five static cuts. Replacing the previous
 * Inter + Plus Jakarta Sans pair also drops the site from two families to one.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#082C6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables live on <html> so `--font-sans`/`--font-display`,
    // which Tailwind emits on :root, can resolve them.
    <html lang="en" className={montserrat.variable}>
      <body>
        {children}
        {/* §10 — site-level graph, emitted once for every page. */}
        <JsonLd data={organizationSchema(siteConfig, offices[0]?.address ?? "")} />
        <JsonLd data={webSiteSchema(siteConfig)} />
      </body>
    </html>
  );
}
