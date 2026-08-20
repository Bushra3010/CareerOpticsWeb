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
  area: "leads" | "content" | "admin";
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
      { label: "Analytics", href: "/admin/crm/analytics", area: "leads" },
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
};
