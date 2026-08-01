import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Server anon client bound to the request's auth cookies. Used by Server
 * Components and by /admin Server Actions, where RLS enforces the role.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // middleware.ts refreshes the session instead.
          }
        },
      },
    },
  );
}
