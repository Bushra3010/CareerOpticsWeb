import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/crm/types/database.types'

// The CRM's tables live in the `crm` Postgres schema so they never collide with
// the website's `public.leads` / `public.profiles` / `public.courses`.
export function createClient() {
  return createBrowserClient<Database, 'crm'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    { db: { schema: 'crm' } }
  )
}
