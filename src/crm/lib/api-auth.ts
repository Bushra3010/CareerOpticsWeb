import 'server-only'

import { NextResponse } from 'next/server'

import { createServerClient } from '@/crm/lib/supabase/server'
import { createClient } from '@/crm/lib/supabase/service'

const PORTAL_ROLES = ['associate', 'student']

type Caller = { userId: string; role: string }

/**
 * Guard for CRM API routes that use the service role. Those routes bypass RLS,
 * so this check is the only boundary: the caller must be signed in, have an
 * active CRM profile, not be a portal (student/associate) account, and — when
 * `allowed` is given — hold one of those roles.
 *
 * Returns the caller, or a 401/403 response to return as-is.
 */
export async function requireCrmStaff(allowed?: string[]): Promise<Caller | NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()
  const profile = data as { role?: string; is_active?: boolean } | null

  if (
    !profile?.role ||
    !profile.is_active ||
    PORTAL_ROLES.includes(profile.role) ||
    (allowed && !allowed.includes(profile.role))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { userId: user.id, role: profile.role }
}

/**
 * Whether the CRM may reset or delete this auth user. Only accounts the CRM
 * owns (staff profiles, student portal logins, associate logins) qualify —
 * and never an active website staff account, so a CRM admin cannot take over
 * the website's /admin through these routes.
 */
export async function isCrmManagedUser(userId: string): Promise<boolean> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: websiteStaff } = await admin
    .schema('public')
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (websiteStaff) return false

  const [profile, student, associate] = await Promise.all([
    admin.from('profiles').select('id').eq('id', userId).maybeSingle(),
    admin.from('students').select('id').eq('portal_user_id', userId).limit(1).maybeSingle(),
    admin.from('associates').select('id').eq('user_id', userId).limit(1).maybeSingle(),
  ])
  return Boolean(profile.data || student.data || associate.data)
}
