import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * GET /api/og/[slug] — dynamic OG image for a college page (PRD §10, §8).
 *
 * Drawn from tokens rather than a photo: no seeded college has a cover image,
 * and a typographic card with the real name, location and credentials is more
 * useful in a WhatsApp preview than a stock campus shot would be. Brand values
 * are inlined because `next/og` renders in an isolated Satori context with no
 * access to the stylesheet.
 */
export const runtime = "edge";

const BRAND_BLUE_900 = "#082C6B";
const BRAND_BLUE_400 = "#3D6FD1";
const BRAND_RED = "#D01E26";
const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = createPublicClient();
  const { data: college } = await supabase
    .from("colleges")
    .select("name, short_name, naac_grade, nirf_rank, cities(name, states(name))")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const title = college?.name ?? siteConfig.name;
  const location = college
    ? [college.cities?.name, college.cities?.states?.name].filter(Boolean).join(", ")
    : siteConfig.tagline;

  const badges = [
    college?.naac_grade ? `NAAC ${college.naac_grade}` : null,
    college?.nirf_rank ? `NIRF #${college.nirf_rank}` : null,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: BRAND_BLUE_900,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* The signature blue→red swipe, §6.1 */}
        <div
          style={{
            width: 160,
            height: 10,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${BRAND_BLUE_400} 0%, ${BRAND_RED} 100%)`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 46 ? 60 : 72,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            {title}
          </div>
          {location ? (
            <div style={{ fontSize: 32, color: "rgba(255,255,255,0.75)", display: "flex" }}>
              {location}
            </div>
          ) : null}

          {badges.length > 0 ? (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {badges.map((badge) => (
                <div
                  key={badge}
                  style={{
                    display: "flex",
                    padding: "8px 20px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.15)",
                    fontSize: 26,
                    fontWeight: 600,
                  }}
                >
                  {badge}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 30, fontWeight: 700, display: "flex" }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", display: "flex" }}>
            Courses · Fees · Admission 2026
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
