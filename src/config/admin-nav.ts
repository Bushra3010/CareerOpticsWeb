import type { UserRole } from "@/lib/auth";

/**
 * Admin sidebar — PRD §5.5.
 *
 * `area` decides who sees an entry (§3): counsellors get leads, editors get
 * content, super admins get everything plus users and settings.
 */
export type AdminNavItem = {
  label: string;
  href: string;
  /**
   * `manager` is the CRM's own tier — HRMS, finance and approvals. It is not
   * one of the §3 permission areas because RLS gates those tables on
   * `crm.is_manager()`, which is a different question from "can work leads":
   * a counsellor has `leads` but must not see salaries.
   */
  area: "leads" | "content" | "admin" | "manager";
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", area: "leads" }],
  },
  {
    // The CRM is where admissions are actually worked. The website inbox below
    // stays as the raw record of what the site captured.
    title: "CRM",
    items: [
      { label: "Pipeline", href: "/admin/crm", area: "leads" },
      { label: "Leads", href: "/admin/crm/leads", area: "leads" },
      { label: "Students", href: "/admin/crm/students", area: "leads" },
      { label: "Appointments", href: "/admin/crm/appointments", area: "leads" },
      { label: "Analytics", href: "/admin/crm/analytics", area: "leads" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Associates", href: "/admin/crm/associates", area: "leads" },
      { label: "Dispatch", href: "/admin/crm/dispatch", area: "leads" },
      { label: "Mentorship", href: "/admin/crm/mentorship", area: "leads" },
      { label: "Targets", href: "/admin/crm/targets", area: "leads" },
      { label: "Notifications", href: "/admin/crm/notifications", area: "leads" },
      { label: "Support", href: "/admin/crm/support", area: "manager" },
    ],
  },
  {
    title: "Money and people",
    items: [
      { label: "Finance", href: "/admin/crm/finance", area: "leads" },
      { label: "Litigation", href: "/admin/crm/litigation", area: "manager" },
      { label: "HRMS", href: "/admin/crm/hrms", area: "manager" },
      { label: "Attendance", href: "/admin/crm/hrms/attendance", area: "manager" },
      { label: "Leave", href: "/admin/crm/hrms/leaves", area: "manager" },
      { label: "Payroll", href: "/admin/crm/hrms/payroll", area: "manager" },
      { label: "Advances", href: "/admin/crm/hrms/advances", area: "manager" },
      { label: "CRM settings", href: "/admin/crm/settings", area: "manager" },
    ],
  },
  {
    title: "Website",
    items: [{ label: "Enquiries", href: "/admin/leads", area: "leads" }],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Colleges", href: "/admin/colleges", area: "content" },
      { label: "Courses", href: "/admin/courses", area: "content" },
      { label: "Exams", href: "/admin/exams", area: "content" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Blogs", href: "/admin/blogs", area: "content" },
      { label: "News", href: "/admin/news", area: "content" },
      { label: "Reviews", href: "/admin/reviews", area: "content" },
      { label: "Testimonials", href: "/admin/testimonials", area: "content" },
      { label: "Gallery", href: "/admin/gallery", area: "content" },
      { label: "Press", href: "/admin/press", area: "content" },
      { label: "Banners", href: "/admin/banners", area: "content" },
      { label: "FAQs", href: "/admin/faqs", area: "content" },
      { label: "Scholarships", href: "/admin/scholarships", area: "content" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/admin/users", area: "admin" },
      { label: "Settings", href: "/admin/settings", area: "admin" },
    ],
  },
];

/** Groups a role can actually see, with empty groups dropped. */
export function navForRole(
  role: UserRole,
  can: (role: UserRole, area: AdminNavItem["area"]) => boolean,
): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(role, item.area)),
  })).filter((group) => group.items.length > 0);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  editor: "Content editor",
  counsellor: "Counsellor",
  telecaller: "Telecaller",
  backend: "Backend",
  finance: "Finance",
  associate: "Associate (portal)",
  student: "Student (portal)",
};
