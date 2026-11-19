'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { FileText, GraduationCap, IndianRupee, Link2, Loader2, PenSquare } from 'lucide-react'

import { ADMISSION_TRACKS, getTrack, type AdmissionTrack, type TrackCategory } from '@/config/admission-tracks'
import { AdmissionLinks } from '@/crm/components/admissions/AdmissionLinks'
import { AdmissionPunchForm } from '@/crm/components/admissions/AdmissionPunchForm'
import { UpiSettings } from '@/crm/components/shared/UpiSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/crm/components/ui/tabs'
import { createClient } from '@/crm/lib/supabase/client'
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from '@/crm/types/app.types'

type Row = {
  id: string
  full_name: string
  phone: string
  status: string
  source: string
  created_at: string
  metadata: { answers?: Record<string, string>; entry?: string; website_source?: string } | null
  assigned_user?: { full_name: string } | null
}

function originLabel(r: Row) {
  if (r.metadata?.answers?.ref) return 'Form link'
  if (r.metadata?.entry === 'crm_admission_form') return 'CRM'
  if (r.source === 'website') return 'Website'
  return r.source.replace(/_/g, ' ')
}

function Applications({ track }: { track: AdmissionTrack }) {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [programme, setProgramme] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let q = (supabase as any)
      .from('leads')
      .select('id, full_name, phone, status, source, created_at, metadata, assigned_user:profiles!leads_assigned_to_fkey(full_name)')
      .eq('category', track.category)
      .order('created_at', { ascending: false })
      .limit(200)
    if (programme) q = q.eq('metadata->answers->>programme', programme)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }, [programme, track.category]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(track.programmes.length > 1 ? ['', ...track.programmes.map((x) => x.name)] : []).map((p) => (
          <button
            key={p || 'all'}
            onClick={() => setProgramme(p)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              programme === p ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            {p || 'All'}
          </button>
        ))}
        <Link href={`/crm/leads?category=${track.category}`} className="ml-auto text-xs font-semibold text-blue-600 hover:underline">
          Open in Leads →
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No {track.label} applications yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rows.map((r) => {
            const a = r.metadata?.answers ?? {}
            const docs = Object.keys(a).filter((k) => k.startsWith('file_')).length + (a.photo_path ? 1 : 0)
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/crm/leads/${r.id}`)}
                className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{r.full_name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {r.phone} · {a.programme ?? 'Programme not set'} · {originLabel(r)}
                    {r.assigned_user?.full_name ? ` · ${r.assigned_user.full_name}` : ''}
                  </p>
                </div>
                {(a.payment_utr || a.payment_amount) && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.payment_verified === 'yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                    {a.payment_amount ? `₹${Number(a.payment_amount).toLocaleString('en-IN')}` : 'Fee'}
                    {a.payment_verified === 'yes' ? ' · verified' : a.payment_utr ? ' · to verify' : ' · unpaid'}
                  </span>
                )}
                <div className="hidden shrink-0 items-center gap-1 text-xs text-gray-500 sm:flex">
                  <FileText className="h-3.5 w-3.5" /> {docs}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${(LEAD_STATUS_COLORS as Record<string, string>)[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {(LEAD_STATUS_LABELS as Record<string, string>)[r.status] ?? r.status}
                </span>
                <span className="hidden w-20 shrink-0 text-right text-xs text-gray-400 md:block">{format(new Date(r.created_at), 'dd MMM yy')}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TRACK_STYLE: Record<TrackCategory, string> = {
  credit_card: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  teacher_training: 'border-violet-200 bg-violet-50 text-violet-900',
  distance: 'border-sky-200 bg-sky-50 text-sky-900',
  open_school: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function AdmissionsClient({ initialTrack }: { initialTrack?: string }) {
  const [tab, setTab] = useState('new')
  const [category, setCategory] = useState<TrackCategory>(getTrack(initialTrack).category)
  const track = getTrack(category)

  function pick(next: TrackCategory) {
    setCategory(next)
    setTab('new')
    const url = new URL(window.location.href)
    url.searchParams.set('track', next)
    window.history.replaceState(null, '', url)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admissions</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Pick a track, then fill the admission form, send the student a form link, or see its applications
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {ADMISSION_TRACKS.map((t) => {
          const active = t.category === category
          return (
            <button
              key={t.category}
              type="button"
              onClick={() => pick(t.category)}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition-shadow ${TRACK_STYLE[t.category]} ${
                active ? 'shadow-md ring-2 ring-offset-1 ring-current' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <p className="text-sm font-bold">{t.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug opacity-80">{t.blurb}</p>
            </button>
          )
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="mb-4">
          <TabsTrigger value="new"><PenSquare className="mr-1 h-4 w-4" /> New Admission</TabsTrigger>
          <TabsTrigger value="links"><Link2 className="mr-1 h-4 w-4" /> Form Links</TabsTrigger>
          <TabsTrigger value="list"><FileText className="mr-1 h-4 w-4" /> Applications</TabsTrigger>
          <TabsTrigger value="upi"><IndianRupee className="mr-1 h-4 w-4" /> UPI &amp; QR</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <div className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <AdmissionPunchForm key={track.category} track={track} onSaved={() => setTab('list')} />
          </div>
        </TabsContent>
        <TabsContent value="links">
          <div className="max-w-3xl"><AdmissionLinks key={track.category} track={track} /></div>
        </TabsContent>
        <TabsContent value="list">
          <Applications key={track.category} track={track} />
        </TabsContent>
        <TabsContent value="upi">
          <div className="max-w-3xl"><UpiSettings /></div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
