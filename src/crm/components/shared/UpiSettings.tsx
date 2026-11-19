'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { FileUpload } from '@/crm/components/shared/FileUpload'
import { Button } from '@/crm/components/ui/button'
import { Input } from '@/crm/components/ui/input'
import { Label } from '@/crm/components/ui/label'
import { Textarea } from '@/crm/components/ui/textarea'
import { createClient } from '@/crm/lib/supabase/client'

type Settings = { upi_id: string | null; payee_name: string | null; qr_image_url: string | null; instructions: string | null }

/**
 * The office's UPI details (`crm.payment_settings`, one row). Used by the
 * admission form links (fee step, QR generated with the amount filled in) and
 * by student document orders.
 */
export function UpiSettings() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings>({ upi_id: '', payee_name: '', qr_image_url: '', instructions: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(supabase as any)
      .from('payment_settings')
      .select('upi_id, payee_name, qr_image_url, instructions')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }: { data: Settings | null }) => data && setSettings(data))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const upi = settings.upi_id?.trim() ?? ''
    if (upi && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(upi)) return toast.error('UPI ID looks wrong — it should be like name@bank')
    setSaving(true)
    const { error } = await (supabase as any).from('payment_settings').upsert({
      id: 1,
      upi_id: upi || null,
      payee_name: settings.payee_name?.trim() || null,
      qr_image_url: settings.qr_image_url || null,
      instructions: settings.instructions?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('UPI details saved')
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-800">Where students pay (UPI)</p>
      <p className="mb-3 text-xs text-gray-500">
        With a UPI ID set, every form and order shows a QR with the exact amount already filled in. The uploaded QR
        image is only used when no UPI ID is set (the student then types the amount).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">UPI ID *</Label>
          <Input value={settings.upi_id ?? ''} onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })} placeholder="e.g. careeroptics@sbi" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Account name (shown in the UPI app)</Label>
          <Input value={settings.payee_name ?? ''} onChange={(e) => setSettings({ ...settings, payee_name: e.target.value })} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Note for students (optional)</Label>
          <Textarea rows={2} value={settings.instructions ?? ''} onChange={(e) => setSettings({ ...settings, instructions: e.target.value })} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">UPI QR code image (optional)</Label>
          {settings.qr_image_url ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.qr_image_url} alt="UPI QR" className="h-24 w-24 rounded border object-contain" />
              <Button size="sm" variant="outline" onClick={() => setSettings({ ...settings, qr_image_url: null })}>Remove</Button>
            </div>
          ) : (
            <FileUpload bucket="student-documents" accept="image/*" onUploadComplete={(url) => setSettings({ ...settings, qr_image_url: url })} />
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Save UPI details
        </Button>
      </div>
    </section>
  )
}
