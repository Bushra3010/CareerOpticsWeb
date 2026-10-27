import { CalendarDays } from 'lucide-react'

import { DocRow, PortalPage } from '@/crm/components/student/PortalPage'
import { getPortalStudent, LABEL } from '@/crm/lib/student'

export default async function StudentExamPage() {
  const { supabase, student } = await getPortalStudent()
  const { data: exams } = await (supabase as any)
    .from('student_exams')
    .select('id, exam_name, exam_date, centre, hall_ticket_number, admit_card_url')
    .eq('student_id', student.id)
    .order('exam_date', { ascending: true })

  return (
    <PortalPage title="Exam & Admit Card" subtitle="Your exam schedule and admit cards" icon={CalendarDays}>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm text-gray-500">Exam status</p>
        <p className="text-xl font-bold text-[#082c6b]">{LABEL[student.exam_status ?? ''] ?? 'Not Scheduled'}</p>
      </div>
      <DocRow label="Admit Card" url={student.admit_card_url} />
      {((exams as any[]) ?? []).map((e) => (
        <div key={e.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="font-bold text-gray-900">{e.exam_name}</p>
          <p className="mt-1 text-sm text-gray-500">
            {e.exam_date ? new Date(e.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date to be announced'}
            {e.centre ? ` · ${e.centre}` : ''}
            {e.hall_ticket_number ? ` · Hall ticket ${e.hall_ticket_number}` : ''}
          </p>
          {e.admit_card_url && (
            <a href={e.admit_card_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">Download admit card</a>
          )}
        </div>
      ))}
    </PortalPage>
  )
}
