'use client'

import { useState } from 'react'
import { BadgeCheck, FileText, GraduationCap, ImageIcon, IndianRupee, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { ALL_ANSWER_LABELS as ANSWER_LABELS, documentLabel as fileLabel } from '@/config/admission-tracks'
import { Button } from '@/crm/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/crm/components/ui/card'
import { createClient } from '@/crm/lib/supabase/client'

/** `answers` keys rendered by the payment block, not the generic field grid. */
const PAYMENT_KEYS = new Set(['payment_amount', 'payment_mode', 'payment_utr', 'payment_verified', 'payment_verified_at', 'file_payment_screenshot'])

const MODE_LABEL: Record<string, string> = { upi: 'UPI', cash: 'Cash', later: 'Not paid yet' }

/** Opens a file from the private admission buckets via a short-lived signed URL. */
export function applicantFileHref(path: string, kind: 'photo' | 'document' = 'document') {
  return `/api/crm/applicant-files?kind=${kind}&path=${encodeURIComponent(path)}`
}

/**
 * The B.Ed / D.El.Ed admission form a lead carries in `metadata.answers` —
 * from the website, a counsellor's form link, or the CRM's own admission form.
 */
export function AdmissionDetails({
  answers,
  leadId,
  metadata,
}: {
  answers: Record<string, unknown> | null | undefined
  /** With these two, staff can mark the UPI payment as verified. */
  leadId?: string
  metadata?: Record<string, unknown> | null
}) {
  if (!answers || typeof answers !== 'object') return null
  const entries = Object.entries(answers).filter(([, v]) => typeof v === 'string' && v.trim())
  if (!entries.length) return null

  const photo = answers.photo_path as string | undefined
  const files = entries.filter(([k]) => k.startsWith('file_') && !PAYMENT_KEYS.has(k))
  const fields = entries.filter(([k]) => !k.startsWith('file_') && k !== 'photo_path' && k !== 'ref' && k !== 'track' && !PAYMENT_KEYS.has(k))
  const programme = answers.programme as string | undefined

  return (
    <Card className="border-violet-200 bg-violet-50/30 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-violet-800">
          <GraduationCap className="h-4 w-4" />
          {programme ? `${programme} Admission Form` : 'Admission Form'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Boolean(answers.payment_utr || answers.payment_amount) && (
          <PaymentBlock answers={answers} leadId={leadId} metadata={metadata} />
        )}
        <div className="flex gap-4">
          {photo && (
            <a
              href={applicantFileHref(photo, 'photo')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-24 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-violet-200 bg-white text-[11px] font-semibold text-violet-700 hover:bg-violet-50"
            >
              <ImageIcon className="h-5 w-5" />
              View photo
            </a>
          )}
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
            {fields.map(([key, value]) => (
              <div key={key}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  {ANSWER_LABELS[key] ?? key.replace(/_/g, ' ')}
                </span>
                <p className="text-sm font-medium text-slate-700 break-words">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
        {files.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-500">Uploaded documents</p>
            <div className="flex flex-wrap gap-2">
              {files.map(([key, value]) => (
                <a
                  key={key}
                  href={applicantFileHref(String(value))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {fileLabel(key)}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentBlock({
  answers,
  leadId,
  metadata,
}: {
  answers: Record<string, unknown>
  leadId?: string
  metadata?: Record<string, unknown> | null
}) {
  const [verified, setVerified] = useState(answers.payment_verified === 'yes')
  const [saving, setSaving] = useState(false)
  const amount = Number(answers.payment_amount)
  const screenshot = answers.file_payment_screenshot as string | undefined

  async function verify() {
    if (!leadId) return
    setSaving(true)
    const supabase = createClient()
    const next = {
      ...(metadata ?? {}),
      answers: { ...answers, payment_verified: 'yes', payment_verified_at: new Date().toISOString() },
    }
    const { error } = await (supabase as any).from('leads').update({ metadata: next }).eq('id', leadId)
    setSaving(false)
    if (error) return toast.error(error.message)
    setVerified(true)
    toast.success('Payment marked as verified')
  }

  return (
    <div className={`rounded-lg border p-3 ${verified ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <IndianRupee className="h-4 w-4" />
          {amount > 0 ? `₹${amount.toLocaleString('en-IN')} form fee` : 'Form fee'}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
            {verified ? 'Verified' : answers.payment_utr ? 'Check UTR in bank statement' : 'Payment pending'}
          </span>
        </p>
        <div className="flex items-center gap-2">
          {screenshot && (
            <a
              href={applicantFileHref(screenshot)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Payment screenshot
            </a>
          )}
          {!verified && leadId && (
            <Button size="sm" onClick={verify} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="mr-1 h-3.5 w-3.5" />}
              {answers.payment_utr ? 'Mark verified' : 'Mark paid'}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        {MODE_LABEL[String(answers.payment_mode ?? 'upi')] ?? 'UPI'}
        {answers.payment_utr ? (
          <>
            {' · UTR: '}
            <span className="font-mono font-semibold text-slate-800">{String(answers.payment_utr)}</span>
          </>
        ) : null}
      </p>
    </div>
  )
}
