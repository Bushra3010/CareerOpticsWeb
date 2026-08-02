import type { Metadata } from "next";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/config/admin-nav";
import { requireSuperAdmin, type UserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

/**
 * `/admin/users` — §5.5, super admin only.
 *
 * Read-only. Creating a staff account means creating a Supabase Auth user,
 * which needs the service-role key; doing that from a page a browser can reach
 * turns one compromised admin session into account creation. Invite staff from
 * the Supabase dashboard (Authentication → Users) — the `on_auth_user_created`
 * trigger writes their `profiles` row, and the role is set here later.
 */
export default async function UsersPage() {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, is_active")
    .order("full_name", { ascending: true, nullsFirst: false });

  const profiles = data ?? [];

  return (
    <div>
      <h1 className="text-h2">Users</h1>
      <p className="mt-1 max-w-2xl text-body">
        Staff accounts with access to this dashboard.
      </p>

      <p className="mt-4 flex max-w-2xl items-start gap-2 rounded-lg bg-brand-blue-50 p-3 text-sm text-ink">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden />
        <span>
          Invite staff from the Supabase dashboard under Authentication → Users.
          A profile row is created automatically; set the role in the{" "}
          <code className="rounded bg-white px-1">profiles</code> table.
        </span>
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-body">
          Could not load users: {error.message}
        </p>
      ) : profiles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-6 text-body">
          No staff profiles yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Staff accounts</caption>
            <thead className="bg-surface">
              <tr>
                {["Name", "Role", "Phone", "Status"].map((heading) => (
                  <th key={heading} scope="col" className="p-3 font-semibold text-ink">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((person) => (
                <tr key={person.id} className="border-t">
                  <td className="p-3 font-medium text-ink">
                    {person.full_name ?? "—"}
                  </td>
                  <td className="p-3 text-body">
                    {ROLE_LABELS[(person.role ?? "counsellor") as UserRole]}
                  </td>
                  <td className="p-3 text-body tabular-nums">
                    {person.phone ?? "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant={person.is_active ? "success" : "outline"} size="sm">
                      {person.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
