'use client'
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/crm/lib/supabase/client'
import { useUIStore } from '@/crm/store/useUIStore'

interface StudentInfo {
  id: string
  full_name: string
  enrollment_number: string
  profile_photo_url: string | null
  course_name: string | null
}

/**
 * Full-width portal header: the CareerOptics lockup over the sidebar column,
 * a search box (searches the public site), notifications and the student menu.
 */
export function StudentTopbar({ student, unreadCount }: { student: StudentInfo; unreadCount: number }) {
  const { setMobileSidebarOpen } = useUIStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const firstName = student.full_name.split(' ')[0] || 'Student'

  async function handleLogout() {
    await createClient().auth.signOut()
    window.location.replace('/crm/student/login')
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    if (q) window.open(`/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener')
  }

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-3 md:h-[88px] md:px-0">
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="-ml-1 rounded-xl p-2 hover:bg-gray-100 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Lockup — same width as the sidebar on desktop */}
      <Link href="/crm/student/dashboard" className="flex shrink-0 items-center gap-2 md:w-72 md:px-6">
        <img src="/brand-logo.png" alt="" className="h-10 w-10 object-contain md:h-14 md:w-14" />
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight md:text-2xl">
            <span className="text-[#0b3b8c]">Career</span><span className="text-[#d01e26]">Optics</span>
          </span>
          <span className="hidden text-[11px] font-bold text-[#082c6b] uppercase sm:block">Education Service Pvt. Ltd.</span>
          <span className="hidden text-[9px] font-medium text-gray-500 lg:block">An ISO 9001:2015 Certified Education Organization</span>
        </span>
      </Link>

      <form onSubmit={onSearch} className="hidden flex-1 md:block md:px-6" role="search">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search</span>
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            placeholder="Search courses, colleges, notifications..."
            className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50/60 pr-4 pl-12 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </form>

      <div className="ml-auto flex items-center gap-2 md:gap-5 md:pr-6">
        <Link
          href="/crm/student/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#082c6b] hover:bg-gray-100"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-3 rounded-xl p-1 hover:bg-gray-50"
            aria-expanded={menuOpen}
          >
            {student.profile_photo_url ? (
              <img src={student.profile_photo_url} alt="" className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#082c6b] text-white md:h-12 md:w-12">
                <User className="h-5 w-5 md:h-6 md:w-6" />
              </span>
            )}
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-xs text-gray-500">Welcome</span>
              <span className="block max-w-32 truncate text-base font-bold text-[#082c6b]">{firstName}</span>
            </span>
            <ChevronDown className="hidden h-5 w-5 text-[#082c6b] md:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                <Link href="/crm/student/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4" /> My Profile
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
