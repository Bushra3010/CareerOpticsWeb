'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { CheckCircle2, Download, FileText, ImageIcon, IndianRupee, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { documentSlug } from '@/config/admission-form'
import { fieldOptions, type AdmissionTrack, type TrackField } from '@/config/admission-tracks'
import { upiPayUri } from '@/config/upi'
import { Button } from '@/crm/components/ui/button'
import { Input } from '@/crm/components/ui/input'
import { Label } from '@/crm/components/ui/label'
import { Textarea } from '@/crm/components/ui/textarea'
import { createClient } from '@/crm/lib/supabase/client'
import { applicantFileHref } from './AdmissionDetails'

const SELECT = 'h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none'

const SOURCES = [
  ['walk_in', 'Walk-in'],
  ['phone', 'Phone call'],
  ['whatsapp', 'WhatsApp'],
  ['referral', 'Referral'],
  ['social_media', 'Social media'],
  ['other', 'Other'],
] as const

type Staff = { id: string; full_name: string }
type Upi = { upi_id: string | null; payee_name: string | null; qr_image_url: string | null }
type PaymentMode = 'upi' | 'cash' | 'later'

async function uploadFile(file: File, kind: 'photo' | 'document'): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind)
  const res = await fetch('/api/crm/applicant-files', { method: 'POST', body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.path) throw new Error(json.error ?? 'Upload failed')
  return json.path as string
}

function UploadSlot({
  label,
  kind,
  path,
  onChange,
}: {
  label: string
  kind: 'photo' | 'document'
  path: string | undefined
  onChange: (path: string | undefined) => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {kind === 'photo' ? <ImageIcon className="h-4 w-4 shrink-0 text-violet-500" /> : <FileText className="h-4 w-4 shrink-0 text-violet-500" />}
        <span className="truncate text-sm font-medium text-gray-700">{label}</span>
      </div>
      {path ? (
        <div className="flex shrink-0 items-center gap-2">
          <a href={applicantFileHref(path, kind)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
          </a>
          <button type="button" onClick={() => onChange(undefined)} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${label}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? 'Uploading' : 'Upload'}
          <input
            type="file"
            className="hidden"
            accept={kind === 'photo' ? 'image/*' : 'image/*,application/pdf'}
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setBusy(true)
              try {
                onChange(await uploadFile(file, kind))
              } catch (err) {
                toast.error((err as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
      )}
    </div>
  )
}

/**
 * Punch a complete admission for one track (Credit Card, B.Ed / D.El.Ed,
 * Distance, NIOS / BBOSE) straight into the CRM. Fields and document slots
 * come from `config/admission-tracks.ts`; everything is stored in the same
 * `metadata.answers` shape as the public form links, so the lead page shows
 * them identically. Mount with `key={track.category}` so switching track
 * starts a clean form.
 */
export function AdmissionPunchForm({ track, onSaved }: { track: AdmissionTrack; onSaved?: (leadId: string) => void }) {
  const supabase = createClient()
  const programmes = track.programmes
  const [programme, setProgramme] = useState<string>(programmes[0].code)
  const [basic, setBasic] = useState({ full_name: '', phone: '', email: '', city: '' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [photo, setPhoto] = useState<string>()
  const [files, setFiles] = useState<Record<string, string>>({})
  const [verification, setVerification] = useState('')
  const [source, setSource] = useState<string>('walk_in')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [staff, setStaff] = useState<Staff[]>([])
  const [me, setMe] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [fee, setFee] = useState('')
  const [payMode, setPayMode] = useState<PaymentMode>('upi')
  const [utr, setUtr] = useState('')
  const [payShot, setPayShot] = useState<string>()
  const [upi, setUpi] = useState<Upi | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [colleges, setColleges] = useState<string[]>([])

  const prog = programmes.find((p) => p.code === programme) ?? programmes[0]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMe(data.user.id)
        setAssignedTo((v) => v || data.user!.id)
      }
    })
    ;(supabase as any)
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .not('role', 'in', '(student,associate)')
      .order('full_name')
      .then(({ data }: { data: Staff[] | null }) => setStaff(data ?? []))
    ;(supabase as any)
      .from('payment_settings')
      .select('upi_id, payee_name, qr_image_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }: { data: Upi | null }) => setUpi(data))
    // Website catalogue (public schema) for the Distance university dropdown.
    if (track.sections.some((s) => s.fields.some((f) => f.optionsFrom === 'colleges'))) {
      ;(supabase as any)
        .schema('public')
        .from('colleges')
        .select('name')
        .eq('status', 'published')
        .order('name')
        .limit(500)
        .then(({ data }: { data: { name: string }[] | null }) => setColleges((data ?? []).map((c) => c.name)))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const amount = Number(fee) > 0 ? Math.round(Number(fee) * 100) / 100 : 0
  const upiUri = amount && upi?.upi_id ? upiPayUri(upi.upi_id, upi.payee_name, amount, `${prog.code} admission`) : null

  // QR with the amount encoded — show it to a walk-in student, or download it and send it on WhatsApp.
  useEffect(() => {
    if (!upiUri || payMode !== 'upi') return setQr(null)
    let live = true
    QRCode.toDataURL(upiUri, { margin: 1, width: 480 }).then((url) => live && setQr(url))
    return () => {
      live = false
    }
  }, [upiUri, payMode])

  /** Hides fields that only apply to another answer, e.g. Stream for 12th. */
  function visible(f: TrackField) {
    return !f.showIf || f.showIf.values.includes(answers[f.showIf.key] ?? '')
  }

  function reset() {
    setBasic({ full_name: '', phone: '', email: '', city: '' })
    setAnswers({})
    setPhoto(undefined)
    setFiles({})
    setVerification('')
    setNotes('')
    setFee('')
    setUtr('')
    setPayShot(undefined)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const phone = basic.phone.replace(/\D/g, '')
    if (basic.full_name.trim().length < 2) return toast.error('Enter the student’s full name')
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter a valid 10-digit mobile number')
    if (amount && payMode === 'upi' && !/^[A-Za-z0-9]{6,30}$/.test(utr.trim())) {
      return toast.error('Enter the UTR / transaction ID of the UPI payment, or choose "Pay later"')
    }

    setSaving(true)
    try {
      const crmCourse = track.crmCourse?.[prog.code]
      const { data: course } = crmCourse
        ? await (supabase as any).from('courses').select('id').eq('name', crmCourse).maybeSingle()
        : { data: null }

      const docSlugs = new Set(prog.documents.map(documentSlug))
      const payloadAnswers: Record<string, string> = { programme: prog.name, track: track.category }
      for (const f of track.sections.flatMap((x) => x.fields)) {
        const v = answers[f.key]?.trim()
        if (v && visible(f)) payloadAnswers[f.key] = v.slice(0, 200)
      }
      if (photo) payloadAnswers.photo_path = photo
      for (const [slug, path] of Object.entries(files)) if (docSlugs.has(slug)) payloadAnswers[`file_${slug}`] = path
      const ready = prog.documents.filter((d) => files[documentSlug(d)])
      if (ready.length) payloadAnswers.documents_ready = ready.join(', ')
      if (verification) payloadAnswers.verification_doc = verification
      if (amount) {
        payloadAnswers.payment_amount = String(amount)
        payloadAnswers.payment_mode = payMode
        if (payMode === 'upi') {
          payloadAnswers.payment_utr = utr.trim().toUpperCase()
          if (payShot) payloadAnswers.file_payment_screenshot = payShot
        }
        // Cash taken at the desk by the person filling the form counts as verified.
        if (payMode === 'cash') {
          payloadAnswers.payment_verified = 'yes'
          payloadAnswers.payment_verified_at = new Date().toISOString()
        }
      }

      const assignee = assignedTo || me
      const { data: lead, error } = await (supabase as any)
        .from('leads')
        .insert({
          full_name: basic.full_name.trim(),
          phone,
          email: basic.email.trim() || null,
          city: basic.city.trim() || answers.address_district?.trim() || null,
          state: answers.address_state?.trim() || null,
          course_id: course?.id ?? null,
          source,
          status: ready.length ? 'document_received' : 'new',
          category: track.category,
          assigned_to: assignee || null,
          assigned_at: assignee ? new Date().toISOString() : null,
          created_by: me || null,
          metadata: { answers: payloadAnswers, entry: 'crm_admission_form' },
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      await (supabase as any).from('lead_activities').insert([
        { lead_id: lead.id, activity_type: 'created', new_value: `${prog.name} admission form filled in CRM`, performed_by: me || null },
        ...(notes.trim() ? [{ lead_id: lead.id, activity_type: 'note_added', note: notes.trim(), performed_by: me || null }] : []),
      ])

      toast.success(`${prog.name} admission saved for ${basic.full_name.trim()}`)
      reset()
      onSaved?.(lead.id)
    } catch (err) {
      toast.error((err as Error).message || 'Could not save the admission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {programmes.length > 1 ? (
      <div className="grid grid-cols-2 gap-2">
        {programmes.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => setProgramme(p.code)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              programme === p.code ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white hover:border-violet-300'
            }`}
          >
            <p className="text-sm font-bold">{p.name}</p>
            <p className={`text-xs ${programme === p.code ? 'text-violet-100' : 'text-gray-500'}`}>{p.documents.length} documents</p>
          </button>
        ))}
      </div>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3">
          <p className="text-sm font-bold text-violet-900">{prog.name}</p>
          <p className="text-xs text-gray-600">{prog.description}</p>
        </div>
      )}

      <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700">Basic details</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Full name *</Label>
            <Input value={basic.full_name} onChange={(e) => setBasic({ ...basic, full_name: e.target.value })} className="bg-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mobile *</Label>
            <Input
              value={basic.phone}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => setBasic({ ...basic, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} className="bg-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">City</Label>
            <Input value={basic.city} onChange={(e) => setBasic({ ...basic, city: e.target.value })} className="bg-white" />
          </div>
        </div>
      </section>

      {track.sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700">{section.title}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section.fields.filter(visible).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                {f.type === 'select' ? (
                  <select className={SELECT} value={answers[f.key] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })}>
                    <option value="">Select</option>
                    {fieldOptions(f, { colleges }).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input
                    type={f.type === 'date' ? 'date' : 'text'}
                    inputMode={f.type === 'tel' ? 'numeric' : undefined}
                    maxLength={f.type === 'tel' ? 10 : 120}
                    value={answers[f.key] ?? ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [f.key]: f.type === 'tel' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value })
                    }
                    className="bg-white"
                  />
                )}
                {f.hint && <p className="text-[11px] text-gray-400">{f.hint}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-700">Photo &amp; documents</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <UploadSlot label="Passport size photo" kind="photo" path={photo} onChange={setPhoto} />
          {prog.documents
            .filter((d) => !/photo/i.test(d))
            .map((d) => {
              const slug = documentSlug(d)
              return (
                <UploadSlot
                  key={slug}
                  label={d}
                  kind="document"
                  path={files[slug]}
                  onChange={(path) =>
                    setFiles((prev) => {
                      const next = { ...prev }
                      if (path) next[slug] = path
                      else delete next[slug]
                      return next
                    })
                  }
                />
              )
            })}
        </div>
        {prog.verification && (
          <div className="mt-3 space-y-1">
            <Label className="text-xs">{prog.verification.label}</Label>
            <select className={SELECT} value={verification} onChange={(e) => setVerification(e.target.value)}>
              <option value="">Select</option>
              {prog.verification.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <h3 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <IndianRupee className="h-3.5 w-3.5" /> Form fee
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Leave empty if no fee"
              className="bg-white"
            />
          </div>
          {amount > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Paid by</Label>
              <select className={SELECT} value={payMode} onChange={(e) => setPayMode(e.target.value as PaymentMode)}>
                <option value="upi">UPI</option>
                <option value="cash">Cash (received at office)</option>
                <option value="later">Pay later</option>
              </select>
            </div>
          )}
        </div>

        {amount > 0 && payMode === 'upi' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-[168px_1fr]">
            <div className="flex flex-col items-center gap-2">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`UPI QR for ₹${amount}`} className="h-40 w-40 rounded-lg border bg-white p-1.5" />
              ) : upi?.qr_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={upi.qr_image_url} alt="Office UPI QR" className="h-40 w-40 rounded-lg border bg-white object-contain p-1.5" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed bg-white p-3 text-center text-xs text-gray-500">
                  Set the UPI ID in the “UPI &amp; QR” tab to get a QR here
                </div>
              )}
              {qr && (
                <a
                  href={qr}
                  download={`upi-${prog.code}-${amount}.png`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download QR to send
                </a>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                {qr
                  ? `Student scans this QR — ₹${amount.toLocaleString('en-IN')} is filled in automatically.`
                  : upi?.qr_image_url
                    ? `Student scans the office QR and enters ₹${amount.toLocaleString('en-IN')}.`
                    : `Collect ₹${amount.toLocaleString('en-IN')} by UPI and enter the UTR below.`}
                {upi?.upi_id ? ` UPI ID: ${upi.upi_id}` : ''}
              </p>
              <div className="space-y-1">
                <Label className="text-xs">UTR / transaction ID *</Label>
                <Input
                  value={utr}
                  maxLength={30}
                  onChange={(e) => setUtr(e.target.value.replace(/\s+/g, ''))}
                  placeholder="12-digit number from the UPI app"
                  className="bg-white font-mono"
                />
              </div>
              <UploadSlot label="Payment screenshot" kind="document" path={payShot} onChange={setPayShot} />
            </div>
          </div>
        )}
        {amount > 0 && payMode === 'later' && (
          <p className="mt-2 text-xs text-gray-500">The fee is recorded on the lead as unpaid; press “Mark paid” on the lead once the student pays.</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Source</Label>
          <select className={SELECT} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Assign to</Label>
          <select className={SELECT} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}{s.id === me ? ' (me)' : ''}</option>)}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white" />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-40">
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Save {prog.name} admission
        </Button>
      </div>
    </form>
  )
}
