import 'server-only'

import { redirect } from 'next/navigation'

import { createServerClient } from '@/crm/lib/supabase/server'

export type PortalStudent = {
  id: string
  full_name: string
  enrollment_number: string
  exam_status: string | null
  result_status: string | null
  admit_card_url: string | null
  enrollment_card_url: string | null
  id_card_url: string | null
  marksheet_url: string | null
  certificate_url: string | null
}

/** The signed-in student's own row (RLS limits it to theirs), or bounce to login. */
export async function getPortalStudent() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/student/login')

  const { data } = await (supabase as any)
    .from('students')
    .select('id, full_name, enrollment_number, exam_status, result_status, admit_card_url, enrollment_card_url, id_card_url, marksheet_url, certificate_url')
    .eq('portal_user_id', user.id)
    .single()
  if (!data) redirect('/crm/student/login')

  return { supabase, student: data as PortalStudent }
}

export const LABEL: Record<string, string> = {
  not_scheduled: 'Not Scheduled', scheduled: 'Scheduled', completed: 'Completed',
  result_awaited: 'Result Awaited', passed: 'Passed', failed: 'Failed',
  awaited: 'Awaited', declared: 'Declared', re_appear: 'Re-Appear',
}
