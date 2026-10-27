'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, User, BookOpen, FileText, CalendarDays, Trophy, Bell,
  CreditCard, Download, Headphones, LogOut, GraduationCap,
} from 'lucide-react'
import { cn } from '@/crm/lib/utils'
import { createClient } from '@/crm/lib/supabase/client'
import { useUIStore } from '@/crm/store/useUIStore'

export const STUDENT_NAV = [
  { label: 'Dashboard',          href: '/crm/student/dashboard',     icon: Home },
  { label: 'Profile',            href: '/crm/student/profile',       icon: User },
  { label: 'My Courses',         href: '/crm/student/materials',     icon: BookOpen },
  { label: 'Applications',       href: '/crm/student/admission',     icon: FileText },
  { label: 'Exam & Admit Card',  href: '/crm/student/exam',          icon: CalendarDays },
  { label: 'Results',            href: '/crm/student/results',       icon: Trophy },
  { label: 'Notifications',      href: '/crm/student/notifications', icon: Bell, badge: true },
  { label: 'Payments',           href: '/crm/student/accounts',      icon: CreditCard },
  { label: 'Downloads',          href: '/crm/student/downloads',     icon: Download },
  { label: 'Help & Support',     href: '/crm/student/support',       icon: Headphones },
] as const

export function StudentSidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const { mobileSidebarOpen: mobileOpen, setMobileSidebarOpen: setMobileOpen } = useUIStore()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.replace('/crm/student/login')
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#082c6b] to-[#0a2a5e] text-white">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {STUDENT_NAV.map(({ label, href, icon: Icon, ...rest }) => {
          const active = pathname === href || (href !== '/crm/student/dashboard' && pathname.startsWith(href))
          const showBadge = 'badge' in rest && unreadCount > 0
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-[22px] w-[22px] shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[22px] w-[22px] shrink-0" />
          Logout
        </button>
      </nav>

      {/* "Your Future, Our Mission" card */}
      <div className="m-3 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-800 to-[#082c6b] p-5 text-center shadow-inner">
        <GraduationCap className="mx-auto h-10 w-10 text-white" />
        <p className="mt-2 font-serif text-2xl leading-tight font-bold text-white italic -rotate-6">
          Your Future
        </p>
        <p className="font-serif text-2xl leading-tight font-bold text-yellow-400 italic -rotate-6">
          Our Mission
        </p>
        <div className="mx-auto mt-2 h-1 w-28 -rotate-6 rounded-full bg-yellow-400" />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-full w-72 shrink-0 flex-col md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer (opened from the topbar hamburger / bottom-nav More) */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 left-0 z-50 h-full w-72 shadow-xl md:hidden">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}
