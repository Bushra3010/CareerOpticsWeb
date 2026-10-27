import { Bell } from 'lucide-react'

import { PortalPage } from '@/crm/components/student/PortalPage'
import { getPortalStudent } from '@/crm/lib/student'

import { MarkAllRead } from './mark-read'

const DOT: Record<string, string> = {
  info: 'bg-blue-500', success: 'bg-emerald-500', warning: 'bg-amber-500', alert: 'bg-red-500',
}

export default async function StudentNotificationsPage() {
  const { supabase, student } = await getPortalStudent()
  const { data } = await (supabase as any)
    .from('student_notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(100)
  const notes = (data as any[]) ?? []

  return (
    <PortalPage title="Notifications" subtitle="Updates from your counsellor" icon={Bell}>
      <div className="flex justify-end">
        <MarkAllRead ids={notes.filter((n) => !n.is_read).map((n) => n.id)} />
      </div>
      {notes.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className={`flex gap-3 rounded-xl border bg-white p-4 shadow-sm ${n.is_read ? 'border-gray-100' : 'border-blue-200'}`}>
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[n.type] ?? DOT.info}`} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalPage>
  )
}
