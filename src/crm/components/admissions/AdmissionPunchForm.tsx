'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { ADMISSION_FIELDS, PROGRAMMES, PROGRAMME_CRM_COURSE, documentSlug } from '@/config/admission-form'
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
 * Punch a complete B.Ed / D.El.Ed admission straight into the CRM — the same
 * fields and document slots as the website's application form, stored in the
 * same `metadata.answers` shape so the lead page shows them identically.
 */
export function AdmissionPunchForm({ onSaved }: { onSaved?: (leadId: string) => void }) {
  const supabase = createClient()
  const [programme, setProgramme] = useState<string>(PROGRAMMES[0].code)
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

  const prog = PROGRAMMES.find((p) => p.code === programme) ?? PROGRAMMES[0]

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setBasic({ full_name: '', phone: '', email: '', city: '' })
    setAnswers({})
    setPhoto(undefined)
    setFiles({})
    setVerification('')
    setNotes('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const phone = basic.phone.replace(/\D/g, '')
    if (basic.full_name.trim().length < 2) return toast.error('Enter the student’s full name')
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter a valid 10-digit mobile number')

    setSaving(true)
    try {
      const { data: course } = await (supabase as any)
        .from('courses')
        .select('id')
        .eq('name', PROGRAMME_CRM_COURSE[prog.code] ?? '')
        .maybeSingle()

      const docSlugs = new Set(prog.documents.map(documentSlug))
      const payloadAnswers: Record<string, string> = { programme: prog.name }
      for (const [k, v] of Object.entries(answers)) if (v.trim()) payloadAnswers[k] = v.trim()
      if (photo) payloadAnswers.photo_path = photo
      for (const [slug, path] of Object.entries(files)) if (docSlugs.has(slug)) payloadAnswers[`file_${slug}`] = path
      const ready = prog.documents.filter((d) => files[documentSlug(d)])
      if (ready.length) payloadAnswers.documents_ready = ready.join(', ')
      if (verification) payloadAnswers.verification_doc = verification

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
          category: 'teacher_training',
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
      <div className="grid grid-cols-2 gap-2">
        {PROGRAMMES.map((p) => (
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

      <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700">Student details</h3>
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
          {ADMISSION_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.type === 'select' ? (
                <select className={SELECT} value={answers[f.key] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })}>
                  <option value="">Select</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input
                  type={f.type === 'date' ? 'date' : 'text'}
                  inputMode={f.type === 'tel' ? 'numeric' : undefined}
                  maxLength={f.type === 'tel' ? 10 : 80}
                  value={answers[f.key] ?? ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [f.key]: f.type === 'tel' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value })
                  }
                  className="bg-white"
                />
              )}
            </div>
          ))}
        </div>
      </section>

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
