import { BookOpen, Building2, FileText, MapPin } from "lucide-react";

import type { SiteStats } from "@/lib/queries/home";

/**
 * §5.1 item 6. Every counter is a live row count — nothing here is a marketing
 * figure, so the strip stays true after the demo seed is replaced.
 *
 * Deliberately NOT shown: "Students Helped" and "Success Rate". Both are
 * unverifiable claims, and a lead-gen page that overstates its reach is the
 * same trust problem flagged at the top of `seed.sql`. Add them the day there
 * is a real number to put behind them.
 */
export function StatsStrip({ stats }: { stats: SiteStats }) {
  const items = [
    {
      label: "Colleges Listed",
      value: stats.colleges,
      icon: Building2,
      tint: "bg-stream-violet-tint text-stream-violet",
    },
    {
      label: "Courses Covered",
      value: stats.courses,
      icon: BookOpen,
      tint: "bg-stream-green-tint text-stream-green",
    },
    {
      label: "Exams Tracked",
      value: stats.exams,
      icon: FileText,
      tint: "bg-stream-orange-tint text-stream-orange",
    },
    {
      label: "Cities Covered",
      value: stats.cities,
      icon: MapPin,
      tint: "bg-stream-blue-tint text-stream-blue",
    },
  ];

  return (
    <section aria-label="CareerOptics in numbers" className="pb-12 lg:pb-16">
      <div className="container-site">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border bg-card p-6 shadow-card lg:grid-cols-4 lg:p-8">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.tint}`}
              >
                <item.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-display text-h3 leading-tight text-ink tabular-nums lg:text-h2">
                  {item.value.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
