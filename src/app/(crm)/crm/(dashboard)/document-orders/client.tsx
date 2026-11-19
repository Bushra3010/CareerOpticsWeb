'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, Loader2, Save, Settings2, ShoppingBag, Truck, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { UpiSettings } from '@/crm/components/shared/UpiSettings'
import { Button } from '@/crm/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/crm/components/ui/dialog'
import { Input } from '@/crm/components/ui/input'
import { Label } from '@/crm/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/crm/components/ui/tabs'
import { Textarea } from '@/crm/components/ui/textarea'
import { CREDENTIAL_KINDS, ORDER_STATUS, inr } from '@/crm/lib/credentials'
import { createClient } from '@/crm/lib/supabase/client'

type Order = {
  id: string
  order_no: string
  item_name: string
  quantity: number
  amount: number
  session_label: string | null
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  pincode: string | null
  payment_utr: string
  payment_screenshot_url: string | null
  status: string
  courier: string | null
  tracking_number: string | null
  staff_note: string | null
  created_at: string
  student: { id: string; full_name: string; enrollment_number: string; phone: string } | null
}

type Item = { id: string; name: string; kind: string; description: string | null; price: number; is_active: boolean; sort_order: number }

const FILTERS = [
  ['payment_submitted', 'To verify'],
  ['payment_verified', 'To dispatch'],
  ['dispatched', 'Dispatched'],
  ['delivered', 'Delivered'],
  ['', 'All'],
] as const

function Orders() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('payment_submitted')
  const [dispatching, setDispatching] = useState<Order | null>(null)
  const [rejecting, setRejecting] = useState<Order | null>(null)
  const [courier, setCourier] = useState('')
  const [tracking, setTracking] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = (supabase as any)
      .from('document_orders')
      .select('*, student:students(id, full_name, enrollment_number, phone)')
      .order('created_at', { ascending: false })
      .limit(300)
    if (filter) q = q.eq('status', filter)
    const { data, error } = await q
    if (error) toast.error(error.message)
    setOrders(data ?? [])
    setLoading(false)
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  async function update(o: Order, patch: Record<string, unknown>, done: string) {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const extra =
      patch.status === 'payment_verified' ? { verified_by: user?.id, verified_at: new Date().toISOString() } :
      patch.status === 'dispatched' ? { dispatched_at: new Date().toISOString() } : {}
    const { error } = await (supabase as any).from('document_orders').update({ ...patch, ...extra }).eq('id', o.id)
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success(done)
    setDispatching(null)
    setRejecting(null)
    setCourier('')
    setTracking('')
    setNote('')
    load()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([v, l]) => (
          <button
            key={v || 'all'}
            onClick={() => setFilter(v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${filter === v ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">No orders here.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const st = ORDER_STATUS[o.status] ?? { label: o.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {o.quantity} × {o.item_name}
                      {o.session_label && <span className="font-normal text-gray-500"> · {o.session_label}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.order_no} · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {o.student && (
                      <Link href={`/crm/backend/${o.student.id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                        {o.student.full_name} ({o.student.enrollment_number}) <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{inr(o.amount)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment</p>
                    <p className="font-mono font-semibold text-gray-800">UTR {o.payment_utr}</p>
                    {o.payment_screenshot_url && (
                      <a href={o.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                        View payment screenshot
                      </a>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Deliver to</p>
                    <p className="font-semibold text-gray-800">{o.delivery_name} · {o.delivery_phone}</p>
                    <p className="text-gray-600">{o.delivery_address}{o.pincode ? ` – ${o.pincode}` : ''}</p>
                  </div>
                </div>
                {(o.courier || o.tracking_number || o.staff_note) && (
                  <p className="mt-2 text-xs text-gray-500">
                    {[o.courier && `Courier: ${o.courier}`, o.tracking_number && `Tracking: ${o.tracking_number}`, o.staff_note && `Note: ${o.staff_note}`].filter(Boolean).join(' · ')}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {o.status === 'payment_submitted' && (
                    <>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRejecting(o)}>
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button size="sm" disabled={busy} onClick={() => update(o, { status: 'payment_verified' }, 'Payment verified — student notified')}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Payment received
                      </Button>
                    </>
                  )}
                  {o.status === 'payment_verified' && (
                    <Button size="sm" onClick={() => setDispatching(o)}>
                      <Truck className="mr-1 h-3.5 w-3.5" /> Mark dispatched
                    </Button>
                  )}
                  {o.status === 'dispatched' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => update(o, { status: 'delivered' }, 'Marked delivered')}>
                      Mark delivered
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!dispatching} onOpenChange={(v) => !v && setDispatching(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispatch {dispatching?.item_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Courier</Label>
              <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. India Post, DTDC" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tracking number</Label>
              <Input value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={busy}
              onClick={() =>
                dispatching &&
                update(dispatching, { status: 'dispatched', courier: courier.trim() || null, tracking_number: tracking.trim() || null }, 'Dispatched — student notified')
              }
            >
              Save &amp; notify student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject order {rejecting?.order_no}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Reason (sent to the student)</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. No payment found for this UTR" />
            </div>
            <Button
              className="w-full"
              variant="destructive"
              disabled={busy || !note.trim()}
              onClick={() => rejecting && update(rejecting, { status: 'rejected', staff_note: note.trim() }, 'Order rejected — student notified')}
            >
              Reject order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PricesAndPayment() {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', kind: 'other', price: '' })

  const load = useCallback(async () => {
    const { data: i } = await (supabase as any).from('document_order_items').select('*').order('sort_order')
    setItems(i ?? [])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  async function saveAll() {
    if (items.some((i) => i.is_active && !(Number(i.price) > 0))) return toast.error('Set a price above ₹0 for every item that is on')
    setSaving(true)
    const results = await Promise.all([
      ...items.map((i) =>
        (supabase as any).from('document_order_items').update({ name: i.name, price: Number(i.price) || 0, is_active: i.is_active, description: i.description }).eq('id', i.id),
      ),
    ])
    setSaving(false)
    const err = results.find((r: any) => r.error)
    if (err) return toast.error(err.error.message)
    toast.success('Saved')
  }

  async function addItem() {
    if (!newItem.name.trim()) return
    const { error } = await (supabase as any).from('document_order_items').insert({
      name: newItem.name.trim(),
      kind: newItem.kind,
      price: Number(newItem.price) || 0,
      is_active: false,
      sort_order: items.length + 1,
    })
    if (error) return toast.error(error.message)
    setNewItem({ name: '', kind: 'other', price: '' })
    load()
  }

  return (
    <div className="max-w-3xl space-y-5">
      <UpiSettings />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-1 text-sm font-bold text-gray-800">What students can order</p>
        <p className="mb-3 text-xs text-gray-500">Switch an item on once its price is set. Students only see items that are on.</p>
        <div className="space-y-2">
          {items.map((i, idx) => (
            <div key={i.id} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
              <Input value={i.name} onChange={(e) => setItems(items.map((x, j) => (j === idx ? { ...x, name: e.target.value } : x)))} />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={String(i.price ?? '')}
                  onChange={(e) => setItems(items.map((x, j) => (j === idx ? { ...x, price: e.target.value as unknown as number } : x)))}
                  className="pl-6"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <input type="checkbox" checked={i.is_active} onChange={(e) => setItems(items.map((x, j) => (j === idx ? { ...x, is_active: e.target.checked } : x)))} />
                On
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_130px_110px_auto] gap-2 border-t pt-3">
          <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="New item, e.g. Migration Certificate" />
          <select value={newItem.kind} onChange={(e) => setNewItem({ ...newItem, kind: e.target.value })} className="h-9 rounded-md border border-gray-200 px-2 text-sm">
            {CREDENTIAL_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <Input type="number" min={0} value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="₹ price" />
          <Button variant="outline" onClick={addItem}>Add</Button>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Save prices
        </Button>
      </div>
    </div>
  )
}

export function DocumentOrdersClient() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Document Orders</h1>
        <p className="mt-0.5 text-xs text-gray-400">Physical ID cards and marksheets ordered by students from their portal</p>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="mb-4">
          <TabsTrigger value="orders"><ShoppingBag className="mr-1 h-4 w-4" /> Orders</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="mr-1 h-4 w-4" /> Prices &amp; UPI</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><Orders /></TabsContent>
        <TabsContent value="settings"><PricesAndPayment /></TabsContent>
      </Tabs>
    </div>
  )
}
