import { redirect } from 'next/navigation'
import { endOfMonth, getMonth, getYear, format } from 'date-fns'
import { createServerClient } from '@/crm/lib/supabase/server'
import { DataTable } from '@/crm/components/shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface PerformanceRow {
  id: string
  full_name: string
  leads_assigned: number
  leads_contacted: number
  conversions: number
  revenue: string
  conversion_rate: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const columns: ColumnDef<PerformanceRow>[] = [
  { accessorKey: 'full_name', header: 'Employee' },
  { accessorKey: 'leads_assigned', header: 'Leads Assigned' },
  { accessorKey: 'leads_contacted', header: 'Contacted' },
  { accessorKey: 'conversions', header: 'Conversions' },
  { accessorKey: 'conversion_rate', header: 'Conv. Rate' },
  // Pre-formatted on the server: a `cell` function cannot cross into the
  // client DataTable.
  { accessorKey: 'revenue', header: 'Revenue Generated' },
]

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const { month: monthParam, year: yearParam } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/crm/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || !['admin', 'backend'].includes(profile.role)) redirect('/')

  const now = new Date()
  const month = Number(monthParam ?? getMonth(now) + 1)
  const year = Number(yearParam ?? getYear(now))
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  // Real last day — '-31' is not a valid date in a 30-day month or February.
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

  const [tcRes, leadsRes, paymentsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name'),
    supabase.from('leads').select('id, assigned_to, status').gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('payments').select('lead_id, amount').gte('payment_date', monthStart).lte('payment_date', monthEnd),
  ])
  const agents = tcRes.data as { id: string; full_name: string }[] | null
  const leads = leadsRes.data as { id: string; assigned_to: string | null; status: string }[] | null
  const payments = paymentsRes.data as { lead_id: string | null; amount: number }[] | null

  // Build lead_id → assigned_to map
  const leadOwnerMap = Object.fromEntries((leads ?? []).filter((l) => l.assigned_to).map((l) => [l.id, l.assigned_to!]))

  const rows: PerformanceRow[] = (agents ?? []).map((tc) => {
    const myLeads = (leads ?? []).filter((l) => l.assigned_to === tc.id)
    const contacted = myLeads.filter((l) =>
      ['contacted', 'interested', 'counselled', 'application_sent', 'converted'].includes(l.status)
    ).length
    const converted = myLeads.filter((l) => l.status === 'converted').length
    const revenue = (payments ?? [])
      .filter((p) => p.lead_id && leadOwnerMap[p.lead_id] === tc.id)
      .reduce((s, p) => s + (p.amount ?? 0), 0)
    const rate = myLeads.length > 0 ? ((converted / myLeads.length) * 100).toFixed(1) + '%' : '0%'

    return {
      id: tc.id,
      full_name: tc.full_name,
      leads_assigned: myLeads.length,
      leads_contacted: contacted,
      conversions: converted,
      revenue: fmt(revenue),
      conversion_rate: rate,
    }
  })

  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </div>
      <DataTable data={rows} columns={columns} />
    </div>
  )
}
