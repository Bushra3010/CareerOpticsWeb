import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS. Allowed ONLY inside Route Handlers and
 * Server Actions (PRD §2). The `server-only` import makes importing this from
 * a client component a build error rather than a leaked key.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
