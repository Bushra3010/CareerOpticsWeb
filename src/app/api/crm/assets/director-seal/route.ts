import { NextResponse } from 'next/server'

import { requireCrmStaff } from '@/crm/lib/api-auth'
import { createClient } from '@/crm/lib/supabase/service'

/**
 * The director's signature + company seal, for stamping invoices, receipts
 * and salary slips. It lives in the private `brochures` bucket and is served
 * only to signed-in CRM staff: a public copy would let anyone produce
 * documents that look officially signed.
 */
export async function GET() {
  const caller = await requireCrmStaff()
  if (caller instanceof NextResponse) return caller

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin.storage.from('brochures').download('internal/director-seal.png')
  if (error || !data) return NextResponse.json({ error: 'Seal not found' }, { status: 404 })

  return new NextResponse(await data.arrayBuffer(), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' },
  })
}
