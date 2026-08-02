import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase auth session on every matched request and hands back
 * the response carrying the rotated cookies.
 *
 * Server Components cannot write cookies, so without this the refresh token
 * would never rotate and a counsellor would be signed out mid-shift.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser` revalidates the token with Supabase. `getSession` only reads the
  // cookie, which a client could have forged — never gate access on it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
