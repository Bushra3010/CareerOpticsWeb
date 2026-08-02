import { NextResponse, type NextRequest } from "next/server";

import { can, getStaffProfile } from "@/lib/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/config/leads";
import { createClient } from "@/lib/supabase/server";

/**
 * CSV export of the leads inbox — PRD §5.5.
 *
 * §15: "Phone numbers masked in admin exports for `counsellor` role." A
 * counsellor works leads one at a time through the click-to-call link, which
 * still works; what they should not be able to do is walk out with a
 * spreadsheet of every student's number. Super admins and editors get the full
 * value, counsellors get `98765*****`.
 */
const MAX_ROWS = 5000;

function maskPhone(phone: string) {
  if (phone.length <= 5) return "*".repeat(phone.length);
  return `${phone.slice(0, 5)}${"*".repeat(phone.length - 5)}`;
}

/** RFC 4180 quoting, and a guard against spreadsheet formula injection. */
function csvCell(value: unknown): string {
  if (value == null) return "";
  let text = String(value);
  // A cell starting with =, +, - or @ is executed as a formula by Excel and
  // Sheets. Prefixing with an apostrophe keeps it inert.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const profile = await getStaffProfile();
  if (!profile || !can(profile.role, "leads")) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(
      `created_at, name, phone, country_code, email, city, level, source, status,
       message, utm_source, utm_medium, utm_campaign,
       courses(name), colleges(name)`,
    )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  const status = params.get("status");
  if (status && LEAD_STATUSES.includes(status as LeadStatus)) {
    query = query.eq("status", status as LeadStatus);
  }
  const source = params.get("source");
  if (source) query = query.eq("source", source);
  const q = params.get("q")?.trim();
  if (q) {
    const term = q.replace(/[%,()*\\]/g, " ");
    query = query.or(`name.ilike.*${term}*,phone.ilike.*${term}*`);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`[leads export] ${error.message}`);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }

  const maskNumbers = profile.role === "counsellor";

  const header = [
    "Received",
    "Name",
    "Phone",
    "Email",
    "City",
    "Level",
    "Course",
    "College",
    "Source",
    "Status",
    "Message",
    "UTM source",
    "UTM medium",
    "UTM campaign",
  ];

  const rows = (data ?? []).map((lead) => {
    const phone = `${lead.country_code ?? "+91"}${lead.phone}`;
    return [
      lead.created_at,
      lead.name,
      maskNumbers ? maskPhone(phone) : phone,
      lead.email,
      lead.city,
      lead.level,
      lead.courses?.name,
      lead.colleges?.name,
      lead.source,
      lead.status,
      lead.message,
      lead.utm_source,
      lead.utm_medium,
      lead.utm_campaign,
    ].map(csvCell).join(",");
  });

  // BOM so Excel opens the UTF-8 rupee and name characters correctly.
  const csv = `﻿${[header.map(csvCell).join(","), ...rows].join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="careeroptics-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
