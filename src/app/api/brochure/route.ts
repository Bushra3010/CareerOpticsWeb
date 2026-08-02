import { NextResponse, type NextRequest } from "next/server";

import { notifyCounsellors } from "@/lib/leads/notify";
import { limitLeads } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/validations/lead";

/**
 * POST /api/brochure — PRD §8.
 *
 * The brochure gate: capture the lead first, then hand back a **60-second
 * signed URL** for the private `brochures` bucket (§7). The link is minted per
 * request and expires, so it cannot be shared around the gate.
 */
const SIGNED_URL_TTL_SECONDS = 60;
const BUCKET = "brochures";

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

  const parsed = leadSchema.safeParse(body);
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

  const lead = parsed.data;
  if (lead.hp) return NextResponse.json({ ok: true, id: null, url: null });

  if (!lead.college_id) {
    return NextResponse.json(
      { ok: false, error: "No college selected." },
      { status: 422 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  const limit = await limitLeads(ip ?? "anonymous");
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const supabase = createAdminClient();

  const { data: college, error: collegeError } = await supabase
    .from("colleges")
    .select("name, brochure_url")
    .eq("id", lead.college_id)
    .eq("status", "published")
    .maybeSingle();

  if (collegeError || !college) {
    return NextResponse.json(
      { ok: false, error: "College not found." },
      { status: 404 },
    );
  }
  if (!college.brochure_url) {
    return NextResponse.json(
      { ok: false, error: "No brochure is available for this college yet." },
      { status: 404 },
    );
  }

  // Capture the lead before minting the link — the point of the gate.
  const { data: inserted, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email?.trim() || null,
      city: lead.city?.trim() || null,
      country_code: lead.country_code,
      college_id: lead.college_id,
      source: "brochure",
      page_url: lead.page_url?.trim() || null,
      utm_source: lead.utm_source?.trim() || null,
      utm_medium: lead.utm_medium?.trim() || null,
      utm_campaign: lead.utm_campaign?.trim() || null,
      utm_content: lead.utm_content?.trim() || null,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();

  if (leadError || !inserted) {
    console.error(`[brochure] lead insert failed: ${leadError?.message}`);
    return NextResponse.json(
      { ok: false, error: "We could not save your details. Please try again." },
      { status: 500 },
    );
  }

  // An editor may have stored an absolute URL instead of a bucket path; only a
  // path can be signed.
  const isAbsolute = /^https?:\/\//i.test(college.brochure_url);
  let url: string | null = isAbsolute ? college.brochure_url : null;

  if (!isAbsolute) {
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(college.brochure_url, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed) {
      console.error(`[brochure] signing failed: ${signError?.message}`);
      // The lead is saved; a counsellor can still follow up with the brochure.
      return NextResponse.json(
        {
          ok: false,
          error:
            "We saved your details but could not prepare the download. A counsellor will send it to you.",
        },
        { status: 502 },
      );
    }
    url = signed.signedUrl;
  }

  await notifyCounsellors({ ...lead, source: "brochure" }, inserted.id);

  return NextResponse.json({
    ok: true,
    id: inserted.id,
    url,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
