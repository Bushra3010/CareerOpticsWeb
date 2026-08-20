import { NextResponse } from "next/server";

import { can, getStaffProfile } from "@/lib/auth";
import { createCrmClient } from "@/lib/supabase/crm";

/**
 * Lead typeahead for the appointment booker.
 *
 * A route handler rather than a Server Action because it is a read fired on
 * every keystroke — actions serialise behind the router and would make the
 * field feel stuck. Runs on the caller's session, so RLS still decides which
 * leads come back: a telecaller only ever finds their own.
 */
export async function GET(request: Request) {
  const profile = await getStaffProfile();
  if (!profile || !can(profile.role, "leads")) {
    return NextResponse.json([], { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  // Escape the PostgREST `or` separators — an unescaped comma or paren in the
  // query string would be read as filter syntax rather than as text.
  const safe = q.replace(/[,()*]/g, " ").trim();
  if (!safe) return NextResponse.json([]);

  const supabase = await createCrmClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, phone")
    .or(`full_name.ilike.%${safe}%,phone.ilike.%${safe}%`)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
