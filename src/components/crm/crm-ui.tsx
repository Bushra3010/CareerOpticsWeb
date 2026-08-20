import Link from "next/link";
import type * as React from "react";

/**
 * Shared furniture for the phase-2 CRM screens.
 *
 * Server components with no state, so they cost nothing in the client bundle —
 * every phase-2 page is a table, a stat row and a form, and repeating that
 * markup fourteen times is how the styling drifts apart.
 */

export const CRM_CONTROL =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CrmPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-h2">{title}</h1>
        {description ? <p className="mt-1 text-body">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function CrmStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "urgent" | "success";
}) {
  const toneClass =
    tone === "urgent"
      ? "text-brand-orange"
      : tone === "success"
        ? "text-success"
        : "text-brand-blue";

  return (
    <div className="rounded-xl border bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-display text-h2 tabular-nums ${toneClass}`}>{value}</dd>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CrmEmpty({
  title,
  children,
  icon,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
      {icon ? <div className="mx-auto text-muted-foreground">{icon}</div> : null}
      <h2 className="mt-3 text-h3">{title}</h2>
      {children ? <p className="mt-1 text-body">{children}</p> : null}
    </div>
  );
}

/**
 * A horizontally scrollable table shell.
 *
 * The overflow lives on this wrapper, never on the page body — §11 forbids the
 * page itself scrolling sideways on a phone.
 */
export function CrmTable({
  caption,
  headers,
  children,
  minWidth = 900,
}: {
  caption: string;
  headers: string[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
      <table
        className="w-full border-collapse text-left text-sm"
        style={{ minWidth: `${minWidth}px` }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface">
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="p-3 font-semibold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function CrmSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h3">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Sub-navigation for the module hubs (HRMS, Finance, Settings). */
export function CrmTabs({
  tabs,
  current,
}: {
  tabs: { href: string; label: string }[];
  current: string;
}) {
  return (
    <nav aria-label="Section" className="mt-6 overflow-x-auto">
      <ul className="flex w-max gap-1 border-b">
        {tabs.map((tab) => {
          const active = tab.href === current;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "-mb-px block border-b-2 border-brand-orange px-4 py-2 text-sm font-semibold text-ink"
                    : "-mb-px block border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-ink"
                }
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const HRMS_TABS = [
  { href: "/crm/hrms", label: "Employees" },
  { href: "/crm/hrms/attendance", label: "Attendance" },
  { href: "/crm/hrms/leaves", label: "Leave" },
  { href: "/crm/hrms/payroll", label: "Payroll" },
  { href: "/crm/hrms/advances", label: "Advances" },
];
