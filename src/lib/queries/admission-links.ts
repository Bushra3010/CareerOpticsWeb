import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export type AdmissionLink = {
  code: string;
  programme: string;
  label: string | null;
  /** CRM category: credit_card · teacher_training · distance · open_school. */
  track: string;
  /** Fee for this link in rupees; null when the form takes no payment. */
  amount: number | null;
};

export type UpiPaymentSettings = {
  upiId: string | null;
  payeeName: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
};

function crmAdmin() {
  return (createAdminClient() as unknown as SupabaseClient).schema("crm");
}

/**
 * A counsellor's B.Ed / D.El.Ed form link (`crm.admission_links`, 0031/0032).
 * The table has no anon policy, so it is read with the service role and only
 * the fields the public page needs leave this function.
 */
export async function getAdmissionLink(code: string): Promise<AdmissionLink | null> {
  if (!/^[a-z0-9]{6,32}$/i.test(code)) return null;
  const { data } = await crmAdmin()
    .from("admission_links")
    .select("code, programme, label, is_active, amount, track")
    .eq("code", code)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  const amount = Number(data.amount);
  return {
    code: data.code,
    programme: data.programme,
    label: data.label,
    track: data.track ?? "teacher_training",
    amount: amount > 0 ? amount : null,
  };
}

/** The office's UPI details (`crm.payment_settings`), shared with document orders. */
export async function getUpiPaymentSettings(): Promise<UpiPaymentSettings> {
  const { data } = await crmAdmin()
    .from("payment_settings")
    .select("upi_id, payee_name, qr_image_url, instructions")
    .eq("id", 1)
    .maybeSingle();
  return {
    upiId: data?.upi_id?.trim() || null,
    payeeName: data?.payee_name?.trim() || null,
    qrImageUrl: data?.qr_image_url || null,
    instructions: data?.instructions?.trim() || null,
  };
}

/** Published college names for the Distance form's university dropdown. */
export async function getCollegeNames(): Promise<string[]> {
  const { data } = await createPublicClient()
    .from("colleges")
    .select("name")
    .eq("status", "published")
    .order("name")
    .limit(500);
  return (data ?? []).map((c) => c.name);
}

export { upiPayUri } from "@/config/upi";
