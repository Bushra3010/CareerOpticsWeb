import { redirect } from 'next/navigation'

import { createServerClient } from '@/crm/lib/supabase/server'

import { DocumentOrdersClient } from './client'

export const metadata = { title: 'Document Orders' }

export default async function DocumentOrdersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/crm/login')
  const { data: profile } = (await supabase.from('profiles').select('role').eq('id', user.id).single()) as { data: { role: string } | null }
  if (!profile || !['admin', 'backend'].includes(profile.role)) redirect('/crm/dashboard')
  return <DocumentOrdersClient />
}
