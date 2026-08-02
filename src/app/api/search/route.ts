import { NextResponse, type NextRequest } from "next/server";

import { search } from "@/lib/queries/search";

/**
 * GET /api/search?q= — PRD §8.
 *
 * Public read-only data, so this is cacheable at the edge. The `/search` page
 * renders on the server from the same `search()` helper; this route exists for
 * the header's type-ahead, which lands with the admin work in P10.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  try {
    const results = await search(query);
    return NextResponse.json(results, {
      headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (cause) {
    console.error(`[search] failed: ${cause instanceof Error ? cause.message : cause}`);
    return NextResponse.json(
      { ok: false, error: "Search is unavailable right now." },
      { status: 500 },
    );
  }
}
