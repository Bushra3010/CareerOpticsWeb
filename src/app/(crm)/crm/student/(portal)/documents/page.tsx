import Link from 'next/link'
import { IdCard, ShoppingBag } from 'lucide-react'

import { DocRow, PortalPage } from '@/crm/components/student/PortalPage'
import { CREDENTIAL_KINDS } from '@/crm/lib/credentials'
import { getPortalStudent } from '@/crm/lib/student'

type Credential = { id: string; kind: string; session_label: string | null; title: string | null; file_url: string; created_at: string }

export default async function StudentDocumentsPage() {
  const { supabase, student } = await getPortalStudent()
  const { data } = await (supabase as any)
    .from('student_credentials')
    .select('id, kind, session_label, title, file_url, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: true })
  const rows = (data as Credential[] | null) ?? []

  // Older single-file uploads from the Student Portal manager still count.
  const legacy: Credential[] = [
    ['id_card', student.id_card_url],
    ['marksheet', student.marksheet_url],
    ['certificate', student.certificate_url],
  ]
    .filter(([, url]) => url && !rows.some((r) => r.file_url === url))
    .map(([kind, url]) => ({ id: `legacy-${kind}`, kind: kind as string, session_label: null, title: null, file_url: url as string, created_at: '' }))
  const all = [...legacy, ...rows]

  return (
    <PortalPage title="My Documents" subtitle="Allotment letter, registration, admit cards, ID card and marksheets — session by session" icon={IdCard}>
      <Link
        href="/crm/student/orders"
        className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800 hover:bg-blue-100"
      >
        <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Need a printed copy? Order a physical copy by courier</span>
        <span>→</span>
      </Link>
      {all.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500">
          Nothing issued yet. Your documents will appear here.
        </p>
      ) : (
        CREDENTIAL_KINDS.map((k) => {
          const items = all.filter((r) => r.kind === k.value)
          if (!items.length) return null
          return (
            <section key={k.value} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{k.label}s</h2>
              {items.map((r, i) => (
                <DocRow
                  key={r.id}
                  label={[r.title || `${k.label}${items.length > 1 ? ` ${i + 1}` : ''}`, r.session_label].filter(Boolean).join(' · ')}
                  url={r.file_url}
                />
              ))}
            </section>
          )
        })
      )}
    </PortalPage>
  )
}
