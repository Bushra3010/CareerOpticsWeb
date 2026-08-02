import { NextResponse, type NextRequest } from "next/server";

import { notifyCounsellors } from "@/lib/leads/notify";
import { limitLeads } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/validations/lead";
import type { Database } from "@/types/database.types";

/**
 * POST /api/leads — PRD §8, §9.
 *
 * zod validate → honeypot → rate limit (5/10min/IP) → service-role insert →
 * counsellor notification. Anonymous inserts are blocked by RLS, so this route
 * is the only write path for the table.
 */

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

/** First address in `x-forwarded-for`; the platform appends, so index 0 is the client. */
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return request.headers.get("x-real-ip");
}

/** Postgres `inet` rejects a malformed value, which would fail the insert. */
function asInet(value: string | null): string | null {
  if (!value) return null;
  const ipv4 = /^\d{1,3}(\.\d{1,3}){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  return ipv4.test(value) || ipv6.test(value) ? value : null;
}

function emptyToNull(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

  // Honeypot: a filled hidden field means a bot. Answer 200 so it cannot tell
  // the submission was dropped, but write nothing.
  if (lead.hp) {
    console.warn(`[leads] honeypot tripped from ${clientIp(request) ?? "unknown"}`);
    return NextResponse.json({ ok: true, id: null });
  }

  const ip = clientIp(request);
  const limit = await limitLeads(ip ?? "anonymous");
  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many enquiries from this connection. Please try again shortly.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const supabase = createAdminClient();

  // §9 step 6 — same phone inside 24h still inserts, but carries a pointer to
  // the earlier row so counsellors do not double-dial.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: earlier } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", lead.phone)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const insert: LeadInsert = {
    name: lead.name,
    phone: lead.phone,
    email: emptyToNull(lead.email),
    city: emptyToNull(lead.city),
    country_code: lead.country_code,
    level: (emptyToNull(lead.level) as LeadInsert["level"]) ?? null,
    course_id: emptyToNull(lead.course_id),
    college_id: emptyToNull(lead.college_id),
    message: emptyToNull(lead.message),
    source: lead.source,
    page_url: emptyToNull(lead.page_url),
    utm_source: emptyToNull(lead.utm_source),
    utm_medium: emptyToNull(lead.utm_medium),
    utm_campaign: emptyToNull(lead.utm_campaign),
    utm_content: emptyToNull(lead.utm_content),
    // §5.4 attaches the finder's answers here; §9 step 6 adds the duplicate
    // pointer. Both can apply to the same row, so they are merged rather than
    // one overwriting the other.
    answers:
      lead.answers || earlier
        ? { ...(lead.answers ?? {}), ...(earlier ? { duplicate_of: earlier.id } : {}) }
        : null,
    ip: asInet(ip),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) {
    console.error(`[leads] insert failed: ${error?.message}`);
    return NextResponse.json(
      { ok: false, error: "We could not save your enquiry. Please call us instead." },
      { status: 500 },
    );
  }

  // Notification failures must not fail a lead that is already saved.
  const notified = await notifyCounsellors(lead, data.id);

  return NextResponse.json({ ok: true, id: data.id, notified });
}
