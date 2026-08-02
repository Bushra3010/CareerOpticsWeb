import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * robots.txt — PRD §10.
 *
 * The disallow list is belt-and-braces: every path here already sends
 * `noindex` in its metadata, but keeping crawlers out of filter permutations
 * and the admin saves crawl budget on a catalogue this size.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/search",
          "/compare",
          "/style-guide",
          // Filtered and paged listing views — the canonical /colleges is
          // enough, and the facet combinations would bury it.
          "/colleges?",
          "/college-finder?",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
    host: siteConfig.url,
  };
}
