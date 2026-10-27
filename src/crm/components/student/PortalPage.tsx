import type { LucideIcon } from 'lucide-react'

/** Shared heading + card shell for the smaller student portal pages. */
export function PortalPage({
  title, subtitle, icon: Icon, children,
}: { title: string; subtitle: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#082c6b] text-white">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function DocRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="font-semibold text-gray-800">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Download
        </a>
      ) : (
        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">Not available yet</span>
      )}
    </div>
  )
}
