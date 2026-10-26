import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh + the `/admin` and `/crm` gates — PRD §5.5, §13.
 *
 * `/admin` (website management): only signed-in users reach it. Whether they
 * are *staff* is a second question the admin layout answers by reading
 * `profiles`, because a database round trip here would tax every request.
 * RLS is the real boundary: a signed-in non-staff account sees nothing,
 * because every policy is gated on `is_staff()`.
 *
 * `/crm` (CRM, associate portal, student portal): routed by the user's role in
 * `crm.profiles` — students to the student portal, associates to theirs,
 * everyone else to the staff dashboard.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/crm" || pathname.startsWith("/crm/")) {
    return crmGate(request);
  }

  const { response, user } = await updateSession(request);

  const isLogin = pathname === "/admin/login";
  const isGated = pathname.startsWith("/admin");

  if (isGated && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Come back to the page they actually wanted after signing in.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    // Honour `next` so a bounced visitor lands on the page they asked for.
    // Only same-origin paths, never an absolute URL from the query string —
    // that would be an open redirect.
    const next = request.nextUrl.searchParams.get("next");
    // A leading `//` is protocol-relative, and some browsers normalise a
    // backslash to a slash — both would leave the site.
    const safe =
      next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\");
    url.pathname = safe ? next : "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

async function crmGate(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public short links (invoice PDFs shared on WhatsApp) — no auth.
  if (pathname.startsWith("/crm/i/")) return NextResponse.next();

  const { response, user, supabase } = await updateSession(request);

  const isCrmEntry = pathname === "/crm" || pathname === "/crm/";
  const isStudentLogin = pathname === "/crm/student/login";
  const isStudentRoute = pathname.startsWith("/crm/student/") && !isStudentLogin;
  const isAdminLogin = pathname === "/crm/login" || isCrmEntry;
  const isAssociateRoute =
    pathname.startsWith("/crm/associate") && !pathname.startsWith("/crm/associates");
  const isStaffRoute = !isStudentRoute && !isAssociateRoute && !isAdminLogin && !isStudentLogin;

  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (!user) {
    if (isStudentRoute) return go("/crm/student/login");
    if (isAdminLogin || isStudentLogin) return isCrmEntry ? go("/crm/login") : response;
    return go("/crm/login");
  }

  // The website client is typed for `public`; the CRM schema is untyped here.
  const crm = (supabase as unknown as SupabaseClient).schema("crm");
  const { data: profile } = await crm
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let role = (profile as { role?: string } | null)?.role;

  // No CRM profile yet — a student whose portal login was just created.
  if (!role) {
    const { data: student } = await crm
      .from("students")
      .select("id")
      .eq("portal_user_id", user.id)
      .maybeSingle();
    if (student) role = "student";
  }

  // Signed in, but not a CRM user (e.g. a website-only editor).
  if (!role) {
    if (isAdminLogin || isStudentLogin) return response;
    return go("/crm/login?error=no_profile");
  }

  if (role === "student" && !isStudentRoute) return go("/crm/student/dashboard");
  if (role !== "student" && isStudentRoute) {
    return go(role === "associate" ? "/crm/associate" : "/crm/dashboard");
  }
  if (role === "associate" && isStaffRoute) return go("/crm/associate");

  if (isAdminLogin || isStudentLogin) {
    if (role === "student") return go("/crm/student/dashboard");
    if (role === "associate") return go("/crm/associate");
    return go("/crm/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image files. `/admin` and `/crm`
     * need the gate; the public site needs the session cookie rotated so a
     * signed-in counsellor browsing the site does not get logged out.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
