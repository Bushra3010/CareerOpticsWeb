'use client'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/crm/components/shared/PageHeader'

const DispatchManager = dynamic(
  () => import('@/crm/components/ops/DispatchManager').then(m => ({ default: m.DispatchManager })),
  { ssr: false }
)

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dispatch" description="Manage student document dispatch and delivery" />
      <DispatchManager />
    </div>
  )
}
