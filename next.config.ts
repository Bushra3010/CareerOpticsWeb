import type { NextConfig } from "next";

/**
 * PRD §10 (redirects, images) and §11 (image formats).
 */

/** The Supabase project that serves college logos, covers and gallery images. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    // WebP/AVIF via the Next image pipeline (§11). Storage URLs are the only
    // remote source; anything else should be committed to /public.
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // The widths actually used by the `sizes` attributes across the site.
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [48, 56, 80, 120, 140, 300, 380],
  },

  /**
   * §10: "Slugs are immutable; renames create a 301 in the redirects table."
   *
   * No slug has been renamed yet. When one is, add the old path here rather
   * than editing the row's slug silently — otherwise every inbound link and
   * every indexed URL breaks.
   *
   *   { source: "/colleges/old-slug", destination: "/colleges/new-slug", permanent: true }
   */
  async redirects() {
    return [
      // Legacy paths from the reference site's IA (PRD §4 notes /guides
      // replaces them), so anything already linked lands somewhere useful.
      { source: "/tenth/:path*", destination: "/after-10th", permanent: true },
      { source: "/twelve/:path*", destination: "/after-12th", permanent: true },
      { source: "/ug/:path*", destination: "/after-graduation", permanent: true },
      { source: "/pg/:path*", destination: "/after-pg", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Baseline hardening. A full CSP needs the GTM and Meta domains that
        // land in P12, so it is deliberately not attempted here — a wrong CSP
        // that blocks the site is worse than no CSP.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
