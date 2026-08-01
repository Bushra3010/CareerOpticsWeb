import "server-only";

import { Resend } from "resend";

import { siteConfig } from "@/config/site";
import type { LeadPayload } from "@/lib/validations/lead";

/**
 * Lead notifications — PRD §9 steps 2 and 3.
 *
 * Both channels are env-gated and non-fatal: a lead that is safely in the
 * database must never 500 because an email provider is down. Failures are
 * logged and reported back to the route, which records them on the row.
 */

export type NotifyResult = {
  email: "sent" | "skipped" | "failed";
  whatsapp: "logged" | "skipped";
  error?: string;
};

function recipients(): string[] {
  return (process.env.LEAD_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

function rows(lead: LeadPayload, id: string) {
  return [
    ["Lead ID", id],
    ["Name", lead.name],
    ["Phone", `${lead.country_code} ${lead.phone}`],
    ["Email", lead.email || "—"],
    ["City", lead.city || "—"],
    ["Level", lead.level || "—"],
    ["Message", lead.message || "—"],
    ["Source", lead.source],
    ["Page", lead.page_url || "—"],
    ["UTM source", lead.utm_source || "—"],
    ["UTM medium", lead.utm_medium || "—"],
    ["UTM campaign", lead.utm_campaign || "—"],
    ["UTM content", lead.utm_content || "—"],
  ];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `wa.me` link a counsellor can tap straight from the alert email. */
export function counsellorWhatsAppLink(lead: LeadPayload) {
  const text = `Hi ${lead.name}, this is ${siteConfig.name} calling about your admission enquiry.`;
  const number = `${lead.country_code}${lead.phone}`.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function notifyCounsellors(
  lead: LeadPayload,
  id: string,
): Promise<NotifyResult> {
  const whatsappLink = counsellorWhatsAppLink(lead);

  // §9 step 3 — the Cloud API template send is optional and still unconfigured,
  // so for now the deep link is logged for the counsellor on duty.
  const whatsapp = process.env.WHATSAPP_TOKEN ? "skipped" : "logged";
  if (whatsapp === "logged") {
    console.info(`[lead ${id}] whatsapp deep link: ${whatsappLink}`);
  }

  const to = recipients();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || to.length === 0) {
    console.info(
      `[lead ${id}] email skipped — ${!apiKey ? "RESEND_API_KEY" : "LEAD_NOTIFY_EMAILS"} not set`,
    );
    return { email: "skipped", whatsapp };
  }

  try {
    const table = rows(lead, id)
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#64748B">${label}</td><td style="padding:4px 0;color:#0F172A"><strong>${escapeHtml(String(value))}</strong></td></tr>`,
      )
      .join("");

    const { error } = await new Resend(apiKey).emails.send({
      from: `${siteConfig.name} <${siteConfig.leadEmail}>`,
      to,
      replyTo: lead.email || undefined,
      subject: `New ${lead.source} lead — ${lead.name} (${lead.country_code} ${lead.phone})`,
      html: `<h2 style="font-family:sans-serif;color:#082C6B">New enquiry</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${table}</table>
        <p style="font-family:sans-serif;font-size:14px">
          <a href="tel:${lead.country_code}${lead.phone}">Call</a> ·
          <a href="${whatsappLink}">WhatsApp</a>
        </p>`,
    });

    if (error) throw new Error(error.message);
    return { email: "sent", whatsapp };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause);
    // The row is already saved — surface the failure, do not rethrow.
    console.error(`[lead ${id}] email failed: ${error}`);
    return { email: "failed", whatsapp, error };
  }
}
