import { createServerClient } from '@/crm/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentSidebar } from '@/crm/components/student/StudentSidebar'
import { StudentBottomNav } from '@/crm/components/student/StudentBottomNav'
import { StudentTopbar } from '@/crm/components/student/StudentTopbar'

export default async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/crm/student/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, enrollment_number, profile_photo_url, course:courses(name), portal_active')
    .eq('portal_user_id', user.id)
    .single()

  if (!student) redirect('/crm/student/login')

  const studentInfo = {
    id: (student as { id: string }).id,
    full_name: (student as { full_name: string }).full_name,
    enrollment_number: (student as { enrollment_number: string }).enrollment_number,
    profile_photo_url: (student as { profile_photo_url: string | null }).profile_photo_url ?? null,
    course_name: ((student as { course: { name: string } | null }).course)?.name ?? null,
  }

  const { count: unreadCount } = await (supabase as any)
    .from('student_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentInfo.id)
    .eq('is_read', false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f8fd]">
      <StudentTopbar student={studentInfo} unreadCount={unreadCount ?? 0} />
      <div className="flex min-h-0 flex-1">
        <StudentSidebar unreadCount={unreadCount ?? 0} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </div>
          <footer className="py-4 pb-24 md:pb-4 text-center text-xs text-gray-400 border-t border-gray-100/70">
            CareerOptics Student Portal &mdash; Powered by{' '}
            <a href="https://blinks-ai.com" target="_blank" rel="noopener noreferrer" className="text-blue-500">Blinks AI</a>
          </footer>
        </main>
      </div>
      <StudentBottomNav />
    </div>
  )
}
