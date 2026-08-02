import type { Metadata } from "next";

import { AlertTriangle, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * `/admin/settings` — §5.5, super admin only.
 *
 * Shows the `settings` rows and which integrations are actually wired. The
 * environment checks matter operationally: with `RESEND_API_KEY` unset a lead
 * still saves but nobody is emailed, and that failure is otherwise silent.
 */
export default async function SettingsPage() {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("key, value");

  const integrations = [
    {
      name: "Lead alert emails (Resend)",
      ready: Boolean(process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAILS),
      note: "Without this a lead saves but no one is emailed.",
    },
    {
      name: "Rate limiting (Upstash)",
      ready: Boolean(
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
      ),
      note: "Falls back to a per-instance limiter that resets on deploy.",
    },
    {
      name: "Analytics (GTM)",
      ready: Boolean(process.env.NEXT_PUBLIC_GTM_ID),
      note: "generate_lead and Meta Pixel events are no-ops until this is set.",
    },
    {
      name: "WhatsApp Cloud API",
      ready: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID),
      note: "Optional. The deep link is logged for the counsellor either way.",
    },
  ];

  const demoData = settings?.find((row) => row.key === "seed_data");
  const demoActive =
    demoData?.value && typeof demoData.value === "object"
      ? (demoData.value as { demo_metrics?: boolean }).demo_metrics === true
      : false;

  return (
    <div>
      <h1 className="text-h2">Settings</h1>

      {demoActive ? (
        <p className="mt-4 flex max-w-2xl items-start gap-2 rounded-lg border border-brand-orange/30 bg-brand-orange/10 p-4 text-sm text-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Seed data is still demo data.</strong> Every NAAC grade,
            NIRF rank, package figure and fee in the catalogue was invented
            during development. Replace it with verified partner data before
            launch — publishing invented accreditation numbers about a named
            institution is a legal and trust problem.
          </span>
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-h3">Integrations</h2>
        <ul className="mt-4 grid gap-3">
          {integrations.map((integration) => (
            <li
              key={integration.name}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{integration.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {integration.note}
                </p>
              </div>
              <Badge variant={integration.ready ? "success" : "outline"}>
                {integration.ready ? (
                  <>
                    <Check className="size-3.5" /> Configured
                  </>
                ) : (
                  <>
                    <X className="size-3.5" /> Not set
                  </>
                )}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      {settings && settings.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-h3">Stored settings</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <caption className="sr-only">Settings rows</caption>
              <thead className="bg-surface">
                <tr>
                  <th scope="col" className="p-3 font-semibold text-ink">Key</th>
                  <th scope="col" className="p-3 font-semibold text-ink">Value</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((row) => (
                  <tr key={row.key} className="border-t align-top">
                    <td className="p-3 font-medium text-ink">{row.key}</td>
                    <td className="p-3">
                      <code className="text-sm break-all text-body">
                        {JSON.stringify(row.value)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
