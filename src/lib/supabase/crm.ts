import "server-only";

import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Supabase clients bound to the `crm` schema.
 *
 * The CRM lives in its own Postgres schema so its `leads`, `courses` and
 * `lead_activities` do not collide with the website's — see
 * `0006_crm_schema.sql`. supabase-js targets a schema at construction, so the
 * CRM needs its own clients rather than a per-query option.
 *
 * ⚠ Requires `crm` in Supabase → Settings → API → Exposed schemas.
 *
 * Untyped on purpose: `types/database.types.ts` is generated for the public
 * schema only. Regenerate with `--schema crm` and type these once the CRM
 * settles; the query layer above is typed either way.
 */
export async function createCrmClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      db: { schema: "crm" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role CRM client. Only for work that legitimately runs without a
 * session — the bulk importer writing hundreds of rows, and nothing else.
 * Everything a signed-in user does must go through `createCrmClient` so RLS
 * decides what they can see.
 */
export function createCrmAdminClient() {
  return createSupabaseClient(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      db: { schema: "crm" },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
