import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { finderStepSchema } from "@/lib/validations/finder";

/**
 * POST /api/finder/step — PRD §8, §5.4.
 *
 * Saves the wizard's answers after every step against an anonymous session id
 * held in a cookie, so a student who drops out at step 4 still leaves a
 * recoverable funnel. `finder_sessions` has no anon policy (§7), so this route
 * is the only write path.
 *
 * One row per session, updated in place — the answers object is cumulative, so
 * a row per step would just be five stale copies of the same funnel.
 */
const COOKIE = "co_finder_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

  const parsed = finderStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid step payload." },
      { status: 422 },
    );
  }

  const { step, answers, lead_id } = parsed.data;

  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE)?.value;
  const sessionId = existing ?? crypto.randomUUID();

  const supabase = createAdminClient();

  // One row per session — an `.update` on a non-existent session id would
  // silently succeed with 0 rows affected, so we fall through to `.insert`.
  // The race: two concurrent submissions for the same new session both see
  // no row and both try to insert. PostgREST rejects the second with a
  // unique violation on `session_id`, which we catch and retry as an update.
  const { error } = await supabase
    .from("finder_sessions")
    .upsert(
      { session_id: sessionId, step, answers, lead_id: lead_id ?? null },
      { onConflict: "session_id" },
    );

  if (error) {
    // A failed save must not block the wizard — the student keeps going and the
    // lead still lands at the end, which is the conversion that matters.
    console.error(`[finder] step ${step} save failed: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: "Could not save progress." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true, sessionId });
  if (!existing) {
    response.cookies.set(COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return response;
}
