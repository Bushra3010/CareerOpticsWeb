import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdmissionLink = { code: string; programme: string; label: string | null };

/**
 * A counsellor's B.Ed / D.El.Ed form link (`crm.admission_links`, 0031).
 * The table has no anon policy, so it is read with the service role and only
 * the three fields the public page needs leave this function.
 */
export async function getAdmissionLink(code: string): Promise<AdmissionLink | null> {
  if (!/^[a-z0-9]{6,32}$/i.test(code)) return null;
  const crm = (createAdminClient() as unknown as SupabaseClient).schema("crm");
  const { data } = await crm
    .from("admission_links")
    .select("code, programme, label, is_active")
    .eq("code", code)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return { code: data.code, programme: data.programme, label: data.label };
}
