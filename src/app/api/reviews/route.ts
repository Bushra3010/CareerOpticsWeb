import { NextResponse, type NextRequest } from "next/server";

import { limitLeads } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewSchema } from "@/lib/validations/review";

/**
 * POST /api/reviews — PRD §8.
 *
 * Inserts with `is_approved = false`. Anonymous inserts are blocked by RLS, so
 * like `/api/leads` this route is the only write path, and nothing a visitor
 * submits is visible until an editor approves it.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the details and try again.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const review = parsed.data;

  // Honeypot: answer 200 so a bot cannot tell it was dropped (see lead.ts).
  if (review.hp) {
    return NextResponse.json({ ok: true, id: null });
  }

  const supabase = createAdminClient();

  // The 0004 trigger guard protects the aggregate, but the public endpoint must
  // also defend against a first pending review zeroing a college's rating. If
  // there are no approved reviews yet, a submission would average the new rating
  // over zero rows. Store it unrated — an editor approving a zero-rated review
  // would not change the aggregate either way.
  if (review.rating > 0) {
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("college_id", review.college_id)
      .eq("is_approved", true);

    if ((count ?? 0) === 0) {
      review.rating = 0;
    }
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  // Reviews share the lead endpoint's budget: same abuse surface, same limiter.
  const limit = await limitLeads(`review:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      college_id: review.college_id,
      name: review.name,
      email: review.email?.trim() || null,
      course: review.course?.trim() || null,
      rating: review.rating,
      title: review.title,
      body: review.body,
      is_approved: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(`[reviews] insert failed: ${error?.message}`);
    return NextResponse.json(
      { ok: false, error: "We could not save your review. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
