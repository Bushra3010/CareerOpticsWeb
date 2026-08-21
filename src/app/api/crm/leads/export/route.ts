import { NextResponse, type NextRequest } from "next/server";

import { CRM_SOURCE_LABELS, CRM_STATUS_LABELS } from "@/config/crm";
import { can, getStaffProfile } from "@/lib/auth";
import { listCrmLeads, type CrmLeadFilters } from "@/lib/queries/crm";

/**
 * CSV export of the CRM leads view, honouring the filters on screen.
 *
 * Phone masking (§15) applies here too: a counsellor works leads one at a time
 * through click-to-call, and should not be able to walk out with a spreadsheet
 * of every student's number.
 */
const MAX_PAGES = 40; // 40 × 50 = 2,000 leads

function maskPhone(phone: string) {
  return phone.length <= 5 ? "*".repeat(phone.length) : `${phone.slice(0, 5)}${"*".repeat(phone.length - 5)}`;
}

/** RFC 4180 quoting, plus a guard against spreadsheet formula injection. */
function cell(value: unknown): string {
  if (value == null) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const profile = await getStaffProfile();
  if (!profile || !can(profile.role, "leads")) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const p = request.nextUrl.searchParams;
  const base: CrmLeadFilters = {
    q: p.get("q") ?? undefined,
    status: p.get("status") ?? undefined,
    source: p.get("source") ?? undefined,
    assigned: p.get("assigned") ?? undefined,
    course: p.get("course") ?? undefined,
    session: p.get("session") ?? undefined,
    city: p.get("city") ?? undefined,
    payment: p.get("payment") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    view: p.get("view") ?? undefined,
  };

  const mask = profile.role === "counsellor" || profile.role === "telecaller";
  const rows: string[] = [];

  // Paged rather than one huge range, so RLS and the payment filter apply
  // exactly as they do on screen.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { leads, pageCount } = await listCrmLeads({ ...base, page });
    for (const lead of leads) {
      rows.push(
        [
          lead.created_at,
          lead.full_name,
          mask ? maskPhone(lead.phone) : lead.phone,
          lead.email,
          lead.city,
          lead.state,
          lead.course?.name,
          lead.sub_course?.name,
          lead.session?.name,
          CRM_STATUS_LABELS[lead.status] ?? lead.status,
          lead.custom_status,
          CRM_SOURCE_LABELS[lead.source] ?? lead.source,
          // Strip the internal `website_source` from the metadata blob — it is
          // a tracking detail, not something a counsellor needs in a spreadsheet.
          "",
          lead.next_followup_date,
          lead.total_fee,
          lead.amount_paid,
        ].map(cell).join(","),
      );
    }
    if (page >= pageCount) break;
  }

  const header = [
    "Received", "Name", "Phone", "Email", "City", "State", "Course",
    "Specialisation", "Session", "Status", "Custom status", "Source",
    "Website source", "Next follow-up", "Total fee", "Amount paid",
  ].map(cell).join(",");

  // BOM so Excel reads the UTF-8 rupee sign and Indian names correctly.
  const csv = `﻿${[header, ...rows].join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="careeroptics-crm-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
