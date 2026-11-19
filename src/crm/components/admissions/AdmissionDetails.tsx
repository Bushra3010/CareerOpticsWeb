'use client'

import { FileText, GraduationCap, ImageIcon } from 'lucide-react'

import { ANSWER_LABELS, fileLabel } from '@/config/admission-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/crm/components/ui/card'

/** Opens a file from the private admission buckets via a short-lived signed URL. */
export function applicantFileHref(path: string, kind: 'photo' | 'document' = 'document') {
  return `/api/crm/applicant-files?kind=${kind}&path=${encodeURIComponent(path)}`
}

/**
 * The B.Ed / D.El.Ed admission form a lead carries in `metadata.answers` —
 * from the website, a counsellor's form link, or the CRM's own admission form.
 */
export function AdmissionDetails({ answers }: { answers: Record<string, unknown> | null | undefined }) {
  if (!answers || typeof answers !== 'object') return null
  const entries = Object.entries(answers).filter(([, v]) => typeof v === 'string' && v.trim())
  if (!entries.length) return null

  const photo = answers.photo_path as string | undefined
  const files = entries.filter(([k]) => k.startsWith('file_'))
  const fields = entries.filter(([k]) => !k.startsWith('file_') && k !== 'photo_path' && k !== 'ref')
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
