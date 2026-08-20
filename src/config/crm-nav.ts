import type { UserRole } from "@/lib/auth";

/**
 * `/crm` sidebar.
 *
 * The CRM is its own application, not a section of the website admin: a
 * telecaller works leads all day and never touches a college page, while an
 * editor never sees a student's fees. Splitting the two shells means neither
 * has to scroll past the other's navigation.
 *
 * `area` decides who sees an entry (§3). `manager` is the CRM's own tier —
 * HRMS, finance and approvals. It is deliberately not one of the §3 permission
 * areas, because RLS gates those tables on `crm.is_manager()`, which is a
 * different question from "can work leads": a counsellor has `leads` but must
 * not see salaries.
 */
export type CrmNavItem = {
  label: string;
  href: string;
  area: "leads" | "content" | "admin" | "manager";
};

export type CrmNavGroup = { title: string; items: CrmNavItem[] };

export const CRM_NAV: CrmNavGroup[] = [
  {
    title: "Admissions",
    items: [
      { label: "Pipeline", href: "/crm", area: "leads" },
      { label: "Leads", href: "/crm/leads", area: "leads" },
      { label: "Students", href: "/crm/students", area: "leads" },
      { label: "Appointments", href: "/crm/appointments", area: "leads" },
      { label: "Analytics", href: "/crm/analytics", area: "leads" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Associates", href: "/crm/associates", area: "leads" },
      { label: "Dispatch", href: "/crm/dispatch", area: "leads" },
      { label: "Mentorship", href: "/crm/mentorship", area: "leads" },
      { label: "Targets", href: "/crm/targets", area: "leads" },
      { label: "Notifications", href: "/crm/notifications", area: "leads" },
      { label: "Support", href: "/crm/support", area: "manager" },
    ],
  },
  {
    title: "Money and people",
    items: [
      { label: "Finance", href: "/crm/finance", area: "leads" },
      { label: "Litigation", href: "/crm/litigation", area: "manager" },
      { label: "HRMS", href: "/crm/hrms", area: "manager" },
      { label: "Attendance", href: "/crm/hrms/attendance", area: "manager" },
      { label: "Leave", href: "/crm/hrms/leaves", area: "manager" },
      { label: "Payroll", href: "/crm/hrms/payroll", area: "manager" },
      { label: "Advances", href: "/crm/hrms/advances", area: "manager" },
      { label: "CRM settings", href: "/crm/settings", area: "manager" },
    ],
  },
];

/** Groups a role can actually see, with empty groups dropped. */
export function crmNavForRole(
  role: UserRole,
  can: (role: UserRole, area: CrmNavItem["area"]) => boolean,
): CrmNavGroup[] {
  return CRM_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.area)),
  })).filter((group) => group.items.length > 0);
}

/** True when the role can reach the CRM at all — used to gate the entry link. */
export function canUseCrm(
  role: UserRole,
  can: (role: UserRole, area: CrmNavItem["area"]) => boolean,
): boolean {
  return crmNavForRole(role, can).length > 0;
}
