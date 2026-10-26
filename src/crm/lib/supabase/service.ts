import 'server-only'

import {
  createClient as _createClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js'

/**
 * Drop-in for supabase-js `createClient` used by the CRM's service-role API
 * routes. Pins every query to the `crm` schema; auth.admin and storage calls
 * are schema-independent and behave as before.
 */
export function createClient(
  url: string,
  key: string,
  options: Omit<SupabaseClientOptions<'crm'>, 'db'> = {}
) {
   
  return _createClient<any, 'crm'>(url, key, { ...options, db: { schema: 'crm' } })
}
