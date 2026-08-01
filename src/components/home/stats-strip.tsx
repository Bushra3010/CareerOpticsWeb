import { Building2, BookOpen, FileText, MapPin } from "lucide-react";

import type { SiteStats } from "@/lib/queries/home";

/**
 * §5.1 item 6. Every counter is a live row count — nothing here is a marketing
 * figure, so the strip stays true after the demo seed is replaced.
 */
export function StatsStrip({ stats }: { stats: SiteStats }) {
  const items = [
    { label: "Colleges Listed", value: stats.colleges, icon: Building2 },
    { label: "Courses Covered", value: stats.courses, icon: BookOpen },
    { label: "Exams Tracked", value: stats.exams, icon: FileText },
    { label: "Cities Covered", value: stats.cities, icon: MapPin },
  ];

  return (
    <section aria-label="CareerOptics in numbers" className="bg-brand-blue-900">
      <div className="container-site grid grid-cols-2 gap-px py-8 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1 px-2 py-3 text-center"
          >
            <item.icon className="size-5 text-brand-amber" aria-hidden />
            <p className="font-display text-h2 text-white tabular-nums">
              {item.value.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-white/75">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
