import Link from "next/link";

import { MessageCircle, Phone, Send } from "lucide-react";

import { siteConfig, telHref, whatsappHref } from "@/config/site";

/** §5.1 — mobile-only sticky bar: Call · WhatsApp · Apply Now. */
export function MobileStickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-white shadow-[0_-1px_3px_rgb(15_23_42/0.08)] lg:hidden">
      <a
        href={telHref}
        className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold text-brand-blue"
      >
        <Phone className="size-5" aria-hidden />
        Call
      </a>
      <a
        href={whatsappHref(`Hi ${siteConfig.name}, I need admission guidance.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 border-x py-2.5 text-xs font-semibold text-success"
      >
        <MessageCircle className="size-5" aria-hidden />
        WhatsApp
      </a>
      <Link
        href="/contact"
        className="flex flex-col items-center gap-0.5 bg-brand-red py-2.5 text-xs font-semibold text-white"
      >
        <Send className="size-5" aria-hidden />
        Apply Now
      </Link>
    </div>
  );
}
