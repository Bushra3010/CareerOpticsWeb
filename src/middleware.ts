import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh + `/admin` and `/crm` gates — PRD §5.5, §13.
 *
 * Only signed-in users reach either. Whether they are *staff* is a second
 * question each layout answers by reading `profiles`, because middleware runs
 * on the edge and a database round trip here would tax every request. RLS is
 * the real boundary either way: a signed-in non-staff account sees nothing,
 * because every policy is gated on `is_staff()` / `crm.is_crm_staff()`.
 *
 * The CRM has no login page of its own — one account, one sign-in, and `next`
 * carries the visitor back to the CRM page they actually asked for.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/admin/login";
  const isGated =
    pathname.startsWith("/admin") ||
    pathname === "/crm" ||
    pathname.startsWith("/crm/");

  if (isGated && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Come back to the page they actually wanted after signing in.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    // Honour `next` so a bounced CRM visitor is not dumped on the admin
    // dashboard after signing in. Only same-origin paths, never an absolute
    // URL from the query string — that would be an open redirect.
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
