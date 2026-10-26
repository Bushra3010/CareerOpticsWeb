import { Briefcase, ChevronRight, GraduationCap, Handshake } from "lucide-react";

import { loginOptions, type LoginOptionKey } from "@/config/nav";

const ICONS: Record<LoginOptionKey, typeof Briefcase> = {
  staff: Briefcase,
  student: GraduationCap,
  associate: Handshake,
};

/** The three portal sign-ins as large tappable rows. */
export function LoginOptions() {
  return (
    <ul className="grid gap-3">
      {loginOptions.map(({ key, label, description, href }) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            {/* Plain <a>: the CRM has its own stylesheet — see config/nav.ts. */}
            <a
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-brand-blue-400 focus-visible:ring-2 focus-visible:ring-brand-blue-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{label}</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
              </span>
              <ChevronRight
                className="size-5 text-muted-foreground group-hover:text-brand-blue-400"
                aria-hidden
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
