'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, IdCard, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { FileUpload } from '@/crm/components/shared/FileUpload'
import { Button } from '@/crm/components/ui/button'
import { Input } from '@/crm/components/ui/input'
import { Label } from '@/crm/components/ui/label'
import { CREDENTIAL_KINDS, CREDENTIAL_LABEL } from '@/crm/lib/credentials'
import { createClient } from '@/crm/lib/supabase/client'

type Row = { id: string; kind: string; session_label: string | null; title: string | null; file_url: string; created_at: string }

/**
 * Issue any number of ID cards / marksheets to a student — one per session or
 * semester. Each shows up in the student's portal under "ID Cards & Marksheets".
 */
export function StudentCredentials({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<string>('id_card')
  const [session, setSession] = useState('')
  const [title, setTitle] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [uploadKey, setUploadKey] = useState(0)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('student_credentials')
      .select('id, kind, session_label, title, file_url, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
    if (error) toast.error(error.message)
    setRows(data ?? [])
    setLoading(false)
  }, [studentId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (!fileUrl) return toast.error('Upload the file first')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await (supabase as any).from('student_credentials').insert({
      student_id: studentId,
      kind,
      session_label: session.trim() || null,
      title: title.trim() || null,
      file_url: fileUrl,
      created_by: user?.id,
    })
    if (!error) {
      await (supabase as any).from('student_notifications').insert({
        student_id: studentId,
        title: `New ${CREDENTIAL_LABEL[kind] ?? 'document'} issued`,
        message: `Your ${CREDENTIAL_LABEL[kind] ?? 'document'}${session.trim() ? ` for ${session.trim()}` : ''} is ready to download under ID Cards & Marksheets.`,
        type: 'success',
        category: 'document',
        file_url: fileUrl,
        created_by: user?.id,
      })
    }
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(`${CREDENTIAL_LABEL[kind]} added`)
    setTitle('')
    setFileUrl('')
    setUploadKey((k) => k + 1)
    load()
  }

  async function remove(row: Row) {
    if (!confirm(`Remove this ${CREDENTIAL_LABEL[row.kind] ?? 'document'}? The student will no longer see it.`)) return
    const { error } = await (supabase as any).from('student_credentials').delete().eq('id', row.id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== row.id))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">Issue an ID card / marksheet</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm">
              {CREDENTIAL_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Session / semester</Label>
            <Input value={session} onChange={(e) => setSession(e.target.value)} placeholder="e.g. 2024-26 · Year 1" className="bg-white" maxLength={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 1st Year Marksheet" className="bg-white" maxLength={80} />
          </div>
        </div>
        <div className="mt-3">
          <FileUpload key={uploadKey} bucket="student-documents" accept="image/*,application/pdf" onUploadComplete={setFileUrl} />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={add} disabled={saving || !fileUrl}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Add {CREDENTIAL_LABEL[kind]}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No ID cards or marksheets issued yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <IdCard className="h-4 w-4 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {r.title || CREDENTIAL_LABEL[r.kind]}
                  {r.session_label && <span className="font-normal text-gray-500"> · {r.session_label}</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {CREDENTIAL_LABEL[r.kind]} · added {new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
              <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" aria-label="Open file">
                <Download className="h-4 w-4" />
              </a>
              <button onClick={() => remove(r)} className="text-gray-400 hover:text-red-500" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
