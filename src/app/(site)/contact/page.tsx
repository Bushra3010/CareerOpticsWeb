import type { Metadata } from "next";

import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { DeferredLeadForm } from "@/components/forms/deferred-lead-form";
import { PageHeader } from "@/components/taxonomy/page-header";
import { mapQuery, offices } from "@/config/nav";
import { siteConfig, telHref, whatsappHref } from "@/config/site";
import { getLeadFormOptions } from "@/lib/queries/leads";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Call ${siteConfig.phoneDisplay}, message us on WhatsApp, or send an enquiry. Free admission counselling from ${siteConfig.name}.`,
  alternates: { canonical: "/contact" },
};

/**
 * `/contact` — §4.
 *
 * The form is rendered inline rather than behind a dialog: someone who
 * navigated here came to get in touch, so making them click again to see the
 * fields is friction for no reason.
 */
export default async function ContactPage() {
  const options = await getLeadFormOptions();

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Contact" }]}
        title="Contact Us"
        description="Call, message on WhatsApp, or leave your number and a counsellor will call you back. Free, always."
      />

      <div className="container-site py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <h2 className="text-h3">Reach us directly</h2>
            <ul className="mt-4 grid gap-3">
              <li>
                <a
                  href={telHref}
                  className="card-lift flex items-center gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
                    <Phone className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">Call</span>
                    <span className="block font-semibold text-ink tabular-nums">
                      {siteConfig.phoneDisplay}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref(
                    `Hi ${siteConfig.name}, I need admission guidance.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-lift flex items-center gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <MessageCircle className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">WhatsApp</span>
                    <span className="block font-semibold text-ink">
                      Message us — most students prefer this
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="card-lift flex items-center gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">Email</span>
                    <span className="block font-semibold text-ink">
                      {siteConfig.supportEmail}
                    </span>
                  </span>
                </a>
              </li>
            </ul>

            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" aria-hidden />
              Counsellors call back within 24 hours on working days.
            </p>

            <h2 className="mt-10 text-h3">Office</h2>
            {offices.map((office) => (
              <div key={office.city} className="mt-3 flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-blue-400" aria-hidden />
                <p className="text-body">
                  <span className="block font-semibold text-ink">{office.city}</span>
                  {office.address}
                </p>
              </div>
            ))}

            <div className="mt-6 overflow-hidden rounded-xl border">
              <iframe
                title="CareerOptics head office location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[280px] w-full border-0"
              />
            </div>
          </div>

          <aside>
            <div className="rounded-xl border bg-card p-6 shadow-card lg:sticky lg:top-24">
              <h2 className="text-h3">Send an enquiry</h2>
              <p className="mt-1 text-sm text-body">
                Tell us what you are looking for and a counsellor will call you.
              </p>
              <DeferredLeadForm
                source="contact"
                fields={["email", "city", "level", "course", "message"]}
                courses={options.courses}
                className="mt-4"
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
