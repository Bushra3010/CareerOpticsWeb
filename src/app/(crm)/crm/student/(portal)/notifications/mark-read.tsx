'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/crm/lib/supabase/client'

export function MarkAllRead({ ids }: { ids: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (ids.length === 0) return null
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await (createClient() as any).from('student_notifications').update({ is_read: true }).in('id', ids)
        router.refresh()
        setBusy(false)
      }}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
    >
      Mark all as read
    </button>
  )
}
