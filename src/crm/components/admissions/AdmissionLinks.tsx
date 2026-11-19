'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Link2, Loader2, MessageCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { PROGRAMMES } from '@/config/admission-form'
import { Button } from '@/crm/components/ui/button'
import { Input } from '@/crm/components/ui/input'
import { createClient } from '@/crm/lib/supabase/client'

type LinkRow = {
  id: string
  code: string
  programme: string
  label: string | null
  is_active: boolean
  submissions: number
  amount: number | null
  created_at: string
  created_by: string | null
  creator?: { full_name: string } | null
}

export function admissionLinkUrl(code: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/apply/${code}`
}

/**
 * Shareable B.Ed / D.El.Ed form links. A student opens the link, fills the full
 * admission form on the website and the submission lands in the CRM as the
 * link creator's lead (category B.Ed / D.El.Ed), with a notification.
 */
export function AdmissionLinks() {
  const supabase = createClient()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [programme, setProgramme] = useState<string>(PROGRAMMES[0].code)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('admission_links')
      .select('*, creator:profiles!admission_links_created_by_fkey(full_name)')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setLinks(data ?? [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  async function create() {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await (supabase as any)
      .from('admission_links')
      .insert({ programme, label: label.trim() || null, amount: Number(amount) > 0 ? Number(amount) : null, created_by: user?.id })
    setCreating(false)
    if (error) return toast.error(error.message)
    setLabel('')
    setAmount('')
    toast.success('Form link created')
    load()
  }

  async function toggle(row: LinkRow) {
    const { error } = await (supabase as any).from('admission_links').update({ is_active: !row.is_active }).eq('id', row.id)
    if (error) return toast.error(error.message)
    setLinks((prev) => prev.map((l) => (l.id === row.id ? { ...l, is_active: !l.is_active } : l)))
  }

  async function changeAmount(row: LinkRow) {
    const input = window.prompt('Form fee for this link in ₹ (leave empty for no payment)', row.amount ? String(row.amount) : '')
    if (input === null) return
    const value = Number(input.replace(/[^\d.]/g, ''))
    const next = value > 0 ? value : null
    const { error } = await (supabase as any).from('admission_links').update({ amount: next }).eq('id', row.id)
    if (error) return toast.error(error.message)
    setLinks((prev) => prev.map((l) => (l.id === row.id ? { ...l, amount: next } : l)))
    toast.success(next ? `Fee set to ₹${next.toLocaleString('en-IN')}` : 'Payment step removed')
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied'),
      () => toast.error('Could not copy — select the link and copy it'),
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">Create a form link for a student</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm sm:w-44"
          >
            {PROGRAMMES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. Patna batch, Rahul's students"
            className="bg-white"
          />
          <div className="relative sm:w-36 shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Fee"
              className="bg-white pl-6"
              aria-label="Form fee in rupees"
            />
          </div>
          <Button onClick={create} disabled={creating} className="shrink-0">
            {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Create link
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Forms submitted through your link come to you as leads, with all documents attached. With a fee set, the
          student pays that exact amount by UPI (QR on the form) and submits the UTR and a screenshot. Set the UPI ID
          in the “UPI &amp; QR” tab.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : links.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No form links yet.</p>
      ) : (
        <div className="space-y-2">
          {links.map((l) => {
            const url = admissionLinkUrl(l.code)
            const prog = PROGRAMMES.find((p) => p.code === l.programme)
            const wa = `https://wa.me/?text=${encodeURIComponent(
              `${prog?.name ?? l.programme} admission form — please fill it here: ${url}`,
            )}`
            return (
              <div key={l.id} className={`rounded-xl border bg-white p-3 ${l.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Link2 className="h-4 w-4 text-violet-500" />
                      {prog?.name ?? l.programme}
                      {l.label && <span className="font-normal text-gray-500">· {l.label}</span>}
                      <button
                        type="button"
                        onClick={() => changeAmount(l)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.amount ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                        title="Change fee"
                      >
                        {l.amount ? `₹${Number(l.amount).toLocaleString('en-IN')}` : 'No fee'} ✎
                      </button>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-blue-600">{url}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {l.submissions} form{l.submissions === 1 ? '' : 's'} received
                      {l.creator?.full_name ? ` · by ${l.creator.full_name}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => copy(url)} disabled={!l.is_active}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </Button>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 ${l.is_active ? '' : 'pointer-events-none'}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                    <Button size="sm" variant="ghost" onClick={() => toggle(l)}>
                      {l.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
