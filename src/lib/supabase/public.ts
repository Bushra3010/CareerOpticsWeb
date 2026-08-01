import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Anon client with **no cookie binding**, for reading published public content
 * on the server.
 *
 * `lib/supabase/server.ts` reads request cookies, which opts a route into
 * dynamic rendering — that would defeat the §10 ISR budget on pages like the
 * home page. Public content is identical for every visitor and RLS already
 * restricts anon to `status='published'`, so no session is needed here.
 *
 * Use `server.ts` instead whenever the query depends on who is signed in.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
