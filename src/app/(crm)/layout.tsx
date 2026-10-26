import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { absolute: 'CareerOptics CRM' },
  description: 'Manage leads, students, finance and HR for CareerOptics',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'CareerOptics CRM',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#082c6b',
}

// The root layout owns <html>/<body>; this wrapper carries the CRM's font and
// its own stylesheet so the website's design tokens never apply here.
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-dvh bg-background text-foreground`}>
      {children}
      <Toaster richColors position="top-right" />
    </div>
  )
}
