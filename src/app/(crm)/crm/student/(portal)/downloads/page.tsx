import { Download } from 'lucide-react'

import { DocRow, PortalPage } from '@/crm/components/student/PortalPage'
import { getPortalStudent } from '@/crm/lib/student'

export default async function StudentDownloadsPage() {
  const { student } = await getPortalStudent()
  const docs: [string, string | null][] = [
    ['Admit Card', student.admit_card_url],
    ['Enrollment Card', student.enrollment_card_url],
    ['ID Card', student.id_card_url],
    ['Marksheet', student.marksheet_url],
    ['Certificate', student.certificate_url],
  ]
  return (
    <PortalPage title="Downloads" subtitle="Documents issued to you by CareerOptics" icon={Download}>
      <div className="space-y-3">
        {docs.map(([label, url]) => <DocRow key={label} label={label} url={url} />)}
      </div>
    </PortalPage>
  )
}
