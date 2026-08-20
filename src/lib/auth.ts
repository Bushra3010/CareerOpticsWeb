import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type StaffProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
};

/**
 * The signed-in staff profile, or null.
 *
 * `getUser()` rather than `getSession()`: the session is read straight from a
 * cookie the client controls, so it is not proof of anything. `getUser()`
 * verifies the token with Supabase.
 */
export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // Signed in but with no profile row, or deactivated — not staff.
  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: user.email ?? null,
    full_name: profile.full_name,
    role: profile.role ?? "counsellor",
    phone: profile.phone,
    is_active: profile.is_active,
  };
}

/** Guard for admin pages and server actions. Redirects rather than throwing. */
export async function requireStaff(): Promise<StaffProfile> {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login");
  return profile;
}

export async function requireSuperAdmin(): Promise<StaffProfile> {
  const profile = await requireStaff();
  if (profile.role !== "super_admin") redirect("/admin");
  return profile;
}

/**
 * §3 role map. RLS treats every active profile as "staff" and does not
 * distinguish counsellor from editor, so these are UI-level affordances, not
 * a security boundary — a determined counsellor could still call a content
 * mutation. Tighten the policies before that matters.
 */
export const PERMISSIONS: Record<UserRole, { leads: boolean; content: boolean; admin: boolean }> = {
  super_admin: { leads: true, content: true, admin: true },
  editor: { leads: false, content: true, admin: false },
  counsellor: { leads: true, content: false, admin: false },
  // CRM roles (0005). `backend` and `finance` are the CRM's managers — the
  // `crm.is_manager()` policy grants them the same reach in the database, so
  // the UI must not pretend otherwise.
  telecaller: { leads: true, content: false, admin: false },
  backend: { leads: true, content: true, admin: false },
  finance: { leads: true, content: false, admin: false },
};

/** Roles that see every lead rather than only their own — mirrors crm.is_manager(). */
export function isCrmManager(role: UserRole) {
  return role === "super_admin" || role === "backend" || role === "finance";
}

export function can(role: UserRole, area: keyof (typeof PERMISSIONS)["super_admin"]) {
  return PERMISSIONS[role][area];
}
