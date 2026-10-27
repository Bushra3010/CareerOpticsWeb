import { Trophy } from 'lucide-react'

import { DocRow, PortalPage } from '@/crm/components/student/PortalPage'
import { getPortalStudent, LABEL } from '@/crm/lib/student'

export default async function StudentResultsPage() {
  const { supabase, student } = await getPortalStudent()
  const { data: exams } = await (supabase as any)
    .from('student_exams')
    .select('id, exam_name, score, is_passed, remarks')
    .eq('student_id', student.id)
    .not('score', 'is', null)

  return (
    <PortalPage title="Results" subtitle="Your results, marksheet and certificate" icon={Trophy}>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm text-gray-500">Result status</p>
        <p className="text-xl font-bold text-[#082c6b]">{LABEL[student.result_status ?? ''] ?? 'Awaited'}</p>
      </div>
      {((exams as any[]) ?? []).map((e) => (
        <div key={e.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <p className="font-bold text-gray-900">{e.exam_name}</p>
            {e.remarks && <p className="text-sm text-gray-500">{e.remarks}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{e.score}</p>
            {e.is_passed != null && (
              <p className={`text-xs font-bold ${e.is_passed ? 'text-emerald-600' : 'text-red-600'}`}>{e.is_passed ? 'Passed' : 'Not passed'}</p>
            )}
          </div>
        </div>
      ))}
      <DocRow label="Marksheet" url={student.marksheet_url} />
      <DocRow label="Certificate" url={student.certificate_url} />
    </PortalPage>
  )
}
