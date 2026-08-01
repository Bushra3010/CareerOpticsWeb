import {
  BadgeIndianRupee,
  Handshake,
  Headset,
  MapPinned,
  ShieldCheck,
  Users,
} from "lucide-react";

import { siteConfig } from "@/config/site";

/**
 * §5.1 item 13. Six trust points. These are claims about how the service works
 * rather than performance statistics, so nothing here needs partner data to be
 * verified before launch.
 */
const POINTS = [
  {
    icon: BadgeIndianRupee,
    title: "Free for students",
    body: "Counselling, shortlisting and application help cost you nothing. Universities pay us, you never do.",
  },
  {
    icon: Users,
    title: "One counsellor, start to finish",
    body: "The same person who takes your first call stays with you through admission — no repeating your story.",
  },
  {
    icon: MapPinned,
    title: "Bihar first, pan-India reach",
    body: "We know BCECE, UGEAC and the Bihar Student Credit Card, and we place students across the country.",
  },
  {
    icon: ShieldCheck,
    title: "Only recognised institutions",
    body: "Every college we recommend is UGC, AICTE or council approved. We tell you what the approvals mean.",
  },
  {
    icon: Handshake,
    title: "No fee collected on a college's behalf",
    body: "Every rupee you pay goes to the university through its own official channel. We never handle it.",
  },
  {
    icon: Headset,
    title: "Reachable on WhatsApp",
    body: `Call or message ${siteConfig.phoneDisplay} — most students prefer WhatsApp and we answer there.`,
  },
];

export function WhyUs() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {POINTS.map((point) => (
        <li
          key={point.title}
          className="card-lift flex gap-3 rounded-xl border bg-card p-5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-50 text-brand-blue">
            <point.icon className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-ink">{point.title}</span>
            <span className="mt-1 block text-sm text-body">{point.body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
