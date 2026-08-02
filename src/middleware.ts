import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh + `/admin` gate — PRD §5.5, §13.
 *
 * Only signed-in users reach `/admin`. Whether they are *staff* is a second
 * question the admin layout answers by reading `profiles`, because middleware
 * runs on the edge and a database round trip here would tax every request.
 * RLS is the real boundary either way: a signed-in non-staff account sees
 * nothing, because every admin policy is gated on `is_staff()`.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/admin/login";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Come back to the page they actually wanted after signing in.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image files. `/admin` needs the
     * gate; the public site needs the session cookie rotated so a signed-in
     * counsellor browsing the site does not get logged out.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
