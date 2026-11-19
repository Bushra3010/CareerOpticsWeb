'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Copy, Loader2, Smartphone, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { inr } from '@/crm/lib/credentials'
import { createClient } from '@/crm/lib/supabase/client'

export type OrderItem = { id: string; name: string; kind: string; description: string | null; price: number }
export type PaymentSettings = { upi_id: string | null; payee_name: string | null; qr_image_url: string | null; instructions: string | null }

const FIELD = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none'

/**
 * Order a physical ID card / marksheet. The student pays the office's UPI ID,
 * then submits the UTR (and optionally a screenshot); the office verifies it
 * in the CRM and dispatches. The price is set by the database trigger from
 * the item list, never from this form.
 */
export function OrderForm({
  studentId,
  items,
  settings,
  sessions,
  defaults,
}: {
  studentId: string
  items: OrderItem[]
  settings: PaymentSettings | null
  sessions: string[]
  defaults: { name: string; phone: string; city: string }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [itemId, setItemId] = useState(items[0]?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [session, setSession] = useState('')
  const [name, setName] = useState(defaults.name)
  const [phone, setPhone] = useState(defaults.phone.replace(/^\+91/, ''))
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [utr, setUtr] = useState('')
  const [screenshot, setScreenshot] = useState<string>()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!items.length || !settings?.upi_id) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
        Ordering printed documents is not open yet. Please contact the office for a physical copy.
      </div>
    )
  }

  const item = items.find((i) => i.id === itemId) ?? items[0]
  const amount = Number(item.price) * quantity
  const upiLink =
    `upi://pay?pa=${encodeURIComponent(settings.upi_id)}` +
    `&pn=${encodeURIComponent(settings.payee_name ?? 'CareerOptics')}` +
    `&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`${item.name} order`)}`

  async function uploadScreenshot(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error('Screenshot must be under 5 MB')
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `payment-proofs/${studentId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('student-documents').upload(path, file)
      if (error) throw error
      setScreenshot(supabase.storage.from('student-documents').getPublicUrl(path).data.publicUrl)
    } catch {
      toast.error('Upload failed, please try again')
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (name.trim().length < 2) return toast.error('Enter the receiver’s name')
    if (!/^[6-9]\d{9}$/.test(digits)) return toast.error('Enter a valid 10-digit mobile number')
    if (address.trim().length < 10) return toast.error('Enter the full delivery address')
    if (!/^\d{6}$/.test(pincode)) return toast.error('Enter a 6-digit PIN code')
    if (!/^[A-Za-z0-9]{6,30}$/.test(utr.trim())) return toast.error('Enter the UTR / transaction ID from your UPI app')

    setSaving(true)
    const { error } = await (supabase as any).from('document_orders').insert({
      student_id: studentId,
      item_id: item.id,
      quantity,
      session_label: session || null,
      delivery_name: name.trim(),
      delivery_phone: digits,
      delivery_address: address.trim(),
      pincode,
      payment_utr: utr.trim().toUpperCase(),
      payment_screenshot_url: screenshot ?? null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Order placed! The office will verify your payment and dispatch it.')
    setUtr('')
    setScreenshot(undefined)
    setAddress('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <p className="mb-2 text-sm font-bold text-gray-800">1. What do you need?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setItemId(i.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                i.id === item.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <p className="font-bold text-gray-900">{i.name}</p>
              <p className="text-sm font-semibold text-blue-700">{inr(i.price)}</p>
              {i.description && <p className="mt-0.5 text-xs text-gray-500">{i.description}</p>}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-gray-600">
            Session / semester
            {sessions.length ? (
              <select className={`${FIELD} mt-1`} value={session} onChange={(e) => setSession(e.target.value)}>
                <option value="">Select</option>
                {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input className={`${FIELD} mt-1`} value={session} onChange={(e) => setSession(e.target.value)} placeholder="e.g. 2024-26, Year 1" maxLength={40} />
            )}
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Quantity
            <select className={`${FIELD} mt-1`} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-gray-800">2. Delivery address</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="Receiver’s name" maxLength={80} />
          <input className={FIELD} value={phone} inputMode="numeric" maxLength={10} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile number" />
          <textarea
            className={`${FIELD} h-20 py-2 sm:col-span-2`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={`House / street, village / mohalla, post, district${defaults.city ? ` (${defaults.city})` : ''}, state`}
            maxLength={400}
          />
          <input className={FIELD} value={pincode} inputMode="numeric" maxLength={6} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="PIN code" />
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-bold text-gray-800">3. Pay {inr(amount)}</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          {settings.qr_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.qr_image_url} alt="UPI QR code" className="h-40 w-40 rounded-lg border border-emerald-200 bg-white object-contain p-1" />
          )}
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">UPI ID</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(settings.upi_id!).then(() => toast.success('UPI ID copied'))}
              className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 font-mono font-semibold text-gray-900"
            >
              {settings.upi_id} <Copy className="h-3.5 w-3.5 text-emerald-600" />
            </button>
            {settings.payee_name && <p className="text-xs text-gray-500">Name: {settings.payee_name}</p>}
            <a href={upiLink} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white sm:hidden">
              <Smartphone className="h-3.5 w-3.5" /> Pay {inr(amount)} with UPI app
            </a>
          </div>
        </div>
        {settings.instructions && <p className="mt-3 text-xs text-gray-600">{settings.instructions}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-gray-800">4. Confirm your payment</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={FIELD} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\s/g, ''))} placeholder="UTR / Transaction ID (12 digits)" maxLength={30} />
          <label className={`${FIELD} flex cursor-pointer items-center gap-2 text-gray-600`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : screenshot ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Upload className="h-4 w-4" />}
            {screenshot ? 'Screenshot attached' : 'Payment screenshot (optional)'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) uploadScreenshot(f)
              }}
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#082c6b] text-sm font-bold text-white hover:bg-[#0b3b8c] disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        I have paid {inr(amount)} — place order
      </button>
    </form>
  )
}
