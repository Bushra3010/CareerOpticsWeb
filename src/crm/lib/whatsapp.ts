import 'server-only'

import { createClient } from '@/crm/lib/supabase/service'

/**
 * WhatsApp → CRM lead capture. Called by the Baileys bridge (/whatsapp-bot)
 * for every incoming one-to-one WhatsApp message.
 *
 * - A number we already have a lead for (website form, walk-in, earlier chat)
 *   gets the message added to that lead's timeline.
 * - A new number becomes a `source = 'whatsapp'` lead, assigned round-robin to
 *   an active counsellor, who gets a CRM notification.
 *
 * Capture only — nothing is sent back to the student.
 */

export interface IncomingWhatsApp {
  messageId: string
  /** WhatsApp chat id, e.g. 919876543210@s.whatsapp.net or 1234@lid */
  chatId: string
  /** Phone digits with country code when WhatsApp exposes it, else null. */
  phone: string | null
  name: string | null
  text: string | null
}

/** Roles that work leads (crm.profiles.role). */
const COUNSELLOR_ROLES = ['lead', 'counselor', 'telecaller']

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Indian numbers are stored as 10 digits, like every other CRM lead. */
function leadPhone(msg: IncomingWhatsApp): string | null {
  const digits = (msg.phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  return `+${digits}`
}

async function pickAssignee(client: ReturnType<typeof db>) {
  const { data: agents } = await client
    .from('profiles')
    .select('id, full_name')
    .in('role', COUNSELLOR_ROLES)
    .eq('is_active', true)
    .order('id')
  if (!agents?.length) return null

  // Fewest WhatsApp leads assigned today (IST) wins.
  const nowIst = new Date(Date.now() + 5.5 * 3600 * 1000)
  const dayStart = new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - 5.5 * 3600 * 1000,
  )
  const { data: todays } = await client
    .from('leads')
    .select('assigned_to')
    .eq('source', 'whatsapp')
    .gte('assigned_at', dayStart.toISOString())
    .not('assigned_to', 'is', null)

  const counts = new Map<string, number>(agents.map((a: { id: string }) => [a.id, 0]))
  for (const l of (todays ?? []) as { assigned_to: string }[]) {
    if (counts.has(l.assigned_to)) counts.set(l.assigned_to, counts.get(l.assigned_to)! + 1)
  }
  return (agents as { id: string; full_name: string }[]).reduce((best, a) =>
    counts.get(a.id)! < counts.get(best.id)! ? a : best,
  )
}

async function findLead(client: ReturnType<typeof db>, msg: IncomingWhatsApp, phone: string | null) {
  if (phone) {
    const ten = phone.replace(/\D/g, '').slice(-10)
    const { data } = await client
      .from('leads')
      .select('id, assigned_to')
      .or(`phone.eq.${ten},phone.eq.+91${ten},phone.eq.91${ten},phone.eq.${phone}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data as { id: string; assigned_to: string | null }
  }
  // Number hidden by WhatsApp privacy: match the chat id we stored last time.
  const { data } = await client
    .from('leads')
    .select('id, assigned_to')
    .eq('metadata->>wa_chat_id', msg.chatId)
    .limit(1)
    .maybeSingle()
  return (data as { id: string; assigned_to: string | null } | null) ?? null
}

export async function captureWhatsAppLead(msg: IncomingWhatsApp): Promise<{ leadId: string; created: boolean }> {
  const client = db()
  const phone = leadPhone(msg)
  const text = (msg.text ?? '[media message]').slice(0, 1000)
  const note = `WhatsApp: "${text}"`

  const existing = await findLead(client, msg, phone)
  if (existing) {
    await client.from('lead_activities').insert({ lead_id: existing.id, activity_type: 'note_added', note })
    return { leadId: existing.id, created: false }
  }

  const assignee = await pickAssignee(client).catch(() => null)
  const fullName = msg.name?.trim() || 'WhatsApp Lead'
  const { data: lead, error } = await client
    .from('leads')
    .insert({
      full_name: fullName,
      phone: phone ?? `WhatsApp ${msg.chatId.split('@')[0]}`,
      source: 'whatsapp',
      status: 'new',
      assigned_to: assignee?.id ?? null,
      assigned_at: assignee ? new Date().toISOString() : null,
      metadata: { wa_chat_id: msg.chatId, first_message: text },
    })
    .select('id')
    .single()
  if (error || !lead) throw new Error(`WhatsApp lead insert failed: ${error?.message}`)

  await client.from('lead_activities').insert([
    {
      lead_id: lead.id,
      activity_type: 'created',
      new_value: assignee ? `WhatsApp lead auto-assigned to ${assignee.full_name}` : 'New WhatsApp lead',
    },
    { lead_id: lead.id, activity_type: 'note_added', note },
  ])

  await client.from('notifications').insert({
    title: 'New WhatsApp lead',
    message: `${fullName} (${phone ?? 'number hidden'}) ne WhatsApp pe message kiya: "${text.slice(0, 120)}"`,
    type: 'info',
    ...(assignee ? { target_user_id: assignee.id } : { target_role: 'admin' }),
  })

  return { leadId: lead.id, created: true }
}
