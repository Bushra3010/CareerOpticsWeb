import Link from "next/link";

import { ExternalLink, LogOut, Users } from "lucide-react";

import { signOut } from "@/app/(admin)/admin/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { navForRole, ROLE_LABELS } from "@/config/admin-nav";
import { canUseCrm } from "@/config/crm-nav";
import { can, getStaffProfile } from "@/lib/auth";

/**
 * `/admin` shell — PRD §5.5, §13.
 *
 * Middleware already bounced anyone not signed in. This layout answers the
 * second question: is the signed-in account actually *staff*? An account with
 * no profile row, or a deactivated one, gets the same treatment as a stranger.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getStaffProfile();

  // The login route renders its own page and must not be wrapped in the shell;
  // it lives under /admin so middleware can special-case it, and it never
  // reaches here with a profile because middleware redirects a signed-in user.
  if (!profile) return <>{children}</>;

  const groups = navForRole(profile.role, can);

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 lg:flex">
        <div className="rounded-lg bg-white p-2">
          <Logo href="/admin" imageClassName="h-9 w-auto" />
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <AdminNav groups={groups} />
        </div>

        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-sm font-medium text-white">
            {profile.full_name ?? profile.email}
          </p>
          <p className="px-3 text-sm text-white/60">{ROLE_LABELS[profile.role]}</p>

          {canUseCrm(profile.role, can) ? (
            <Link
              href="/crm"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Users className="size-4" aria-hidden />
              Open the CRM
            </Link>
          ) : null}

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <ExternalLink className="size-4" aria-hidden />
            View site
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header — the sidebar is desktop-only; counsellors work on
            laptops, but the nav still has to be reachable on a phone. */}
        <header className="flex items-center justify-between gap-3 border-b bg-sidebar px-4 py-3 lg:hidden">
          <div className="rounded bg-white px-2 py-1">
            <Logo href="/admin" imageClassName="h-7 w-auto" />
          </div>
          <form action={signOut}>
            <Button type="submit" variant="inverse" size="sm">
              Sign out
            </Button>
          </form>
        </header>

        <div className="lg:hidden">
          <div className="overflow-x-auto border-b bg-sidebar px-4 pb-3">
            <AdminNav groups={groups} />
          </div>
        </div>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
