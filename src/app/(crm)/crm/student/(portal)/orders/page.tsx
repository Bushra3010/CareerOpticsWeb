import { ShoppingBag } from 'lucide-react'

import { PortalPage } from '@/crm/components/student/PortalPage'
import { ORDER_STATUS, inr } from '@/crm/lib/credentials'
import { getPortalStudent } from '@/crm/lib/student'

import { OrderForm, type OrderItem, type PaymentSettings } from './order-form'

type Order = {
  id: string
  order_no: string
  item_name: string
  quantity: number
  amount: number
  session_label: string | null
  status: string
  courier: string | null
  tracking_number: string | null
  staff_note: string | null
  created_at: string
}

export default async function StudentOrdersPage() {
  const { supabase, student } = await getPortalStudent()
  const db = supabase as any
  const [{ data: items }, { data: settings }, { data: orders }, { data: creds }, { data: me }] = await Promise.all([
    db.from('document_order_items').select('id, name, kind, description, price').eq('is_active', true).order('sort_order'),
    db.from('payment_settings').select('upi_id, payee_name, qr_image_url, instructions').eq('id', 1).maybeSingle(),
    db
      .from('document_orders')
      .select('id, order_no, item_name, quantity, amount, session_label, status, courier, tracking_number, staff_note, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false }),
    db.from('student_credentials').select('session_label').eq('student_id', student.id),
    db.from('students').select('phone, city').eq('id', student.id).maybeSingle(),
  ])

  const sessions = Array.from(
    new Set(((creds as { session_label: string | null }[]) ?? []).map((c) => c.session_label).filter(Boolean) as string[]),
  )
  const list = (orders as Order[] | null) ?? []

  return (
    <PortalPage title="Order Documents" subtitle="Order a printed ID card or marksheet, delivered to your address" icon={ShoppingBag}>
      <OrderForm
        studentId={student.id}
        items={(items as OrderItem[]) ?? []}
        settings={(settings as PaymentSettings | null) ?? null}
        sessions={sessions}
        defaults={{ name: student.full_name, phone: me?.phone ?? '', city: me?.city ?? '' }}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">My orders</h2>
        {list.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">No orders yet.</p>
        ) : (
          list.map((o) => {
            const st = ORDER_STATUS[o.status] ?? { label: o.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={o.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">
                      {o.quantity} × {o.item_name}
                      {o.session_label ? <span className="font-normal text-gray-500"> · {o.session_label}</span> : null}
                    </p>
                    <p className="text-xs text-gray-400">
                      {o.order_no} · {new Date(o.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · Paid {inr(o.amount)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </div>
                {(o.courier || o.tracking_number) && (
                  <p className="mt-2 text-sm text-gray-600">
                    {o.courier ? `Courier: ${o.courier}` : ''}
                    {o.tracking_number ? ` · Tracking no: ${o.tracking_number}` : ''}
                  </p>
                )}
                {o.staff_note && <p className="mt-1 text-sm text-gray-500">Note: {o.staff_note}</p>}
              </div>
            )
          })
        )}
      </section>
    </PortalPage>
  )
}
