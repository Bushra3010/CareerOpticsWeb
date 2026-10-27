import {
  ArrowRight, BookOpen, BookOpenText, GraduationCap, Palette, Scale, Settings,
  ShieldCheck, Sprout, Star, Stethoscope, Users, type LucideIcon,
} from 'lucide-react'

import { getStudyGoals } from '@/lib/queries/home'

/** Card colour + icon per website stream slug, in the order the design shows. */
const GOALS: { slug: string; icon: LucideIcon; bg: string }[] = [
  { slug: 'engineering', icon: Settings,    bg: 'from-blue-600 to-blue-500' },
  { slug: 'medical',     icon: Stethoscope, bg: 'from-emerald-600 to-teal-500' },
  { slug: 'management',  icon: BookOpen,    bg: 'from-violet-600 to-indigo-500' },
  { slug: 'arts',        icon: Palette,     bg: 'from-orange-500 to-amber-400' },
  { slug: 'law',         icon: Scale,       bg: 'from-rose-600 to-red-500' },
  { slug: 'agriculture', icon: Sprout,      bg: 'from-teal-600 to-emerald-500' },
]

const TRUST = [
  { label: ['100% Genuine', 'Guidance'],          icon: BookOpenText, tone: 'bg-blue-100 text-blue-700' },
  { label: ['Trusted', 'Education Partner'],      icon: ShieldCheck,  tone: 'bg-green-100 text-green-700' },
  { label: ['Experienced', 'Counsellors'],        icon: Users,        tone: 'bg-violet-100 text-violet-700' },
  { label: ['Your Success', 'Our Priority'],      icon: Star,         tone: 'bg-amber-100 text-amber-500' },
]

/**
 * Top of the student dashboard: greeting banner, the website's study-goal
 * streams with live college counts, and the trust strip. Stream cards open the
 * public site in a new tab (plain <a> — it has its own stylesheet).
 */
export async function StudentWelcome({ firstName }: { firstName: string }) {
  let streams: { slug: string; name: string; collegeCount: number }[] = []
  try {
    streams = await getStudyGoals()
  } catch {
    streams = []
  }
  const bySlug = new Map(streams.map((s) => [s.slug, s]))
  const cards = GOALS.flatMap((g) => {
    const s = bySlug.get(g.slug)
    return s ? [{ ...g, name: s.name, count: s.collegeCount }] : []
  })

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100 p-6 md:p-10">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
            Hello, <span className="text-blue-700">{firstName}</span>
          </h1>
          <p className="mt-3 text-base text-gray-600 md:text-lg">
            Pick a stream to explore top colleges, courses and entrance exams that lead into your dream career.
          </p>
        </div>
        {/* Decorative swoosh + cap + slogan */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
          <div className="absolute -right-10 -bottom-24 h-72 w-[130%] rounded-[50%] border-t-[28px] border-blue-500/80" />
          <div className="absolute -right-10 -bottom-32 h-72 w-[130%] rounded-[50%] border-t-[22px] border-yellow-400/90" />
          <GraduationCap className="absolute top-8 left-10 h-20 w-20 text-blue-600 -rotate-12" />
          <p className="absolute top-8 right-10 rotate-[-12deg] text-right font-serif text-3xl leading-tight font-bold text-[#082c6b] italic">
            Dream<br />Learn<br />Achieve
          </p>
        </div>
      </section>

      {/* Select your study goal */}
      {cards.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-extrabold text-gray-900">
                <BookOpenText className="h-7 w-7 text-[#082c6b]" /> Select Your Study Goal
              </h2>
              <div className="mt-2 h-1 w-44 rounded-full bg-gradient-to-r from-blue-600 to-yellow-400" />
            </div>
            <p className="text-sm text-blue-700 italic">Pick a stream to explore top colleges, courses and entrance exams</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ slug, name, count, icon: Icon, bg }) => (
              <a
                key={slug}
                href={`/streams/${slug}`}
                target="_blank"
                rel="noopener"
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${bg} p-6 text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <Icon aria-hidden className="absolute -top-2 right-6 h-28 w-28 text-white/10" />
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-white/15">
                  <Icon className="h-8 w-8" />
                </span>
                <p className="mt-4 text-2xl font-bold">{name}</p>
                <p className="text-base text-white/90">{count} Colleges</p>
                <span className="absolute right-5 bottom-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="grid grid-cols-2 gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 lg:grid-cols-4">
        {TRUST.map(({ label, icon: Icon, tone }) => (
          <div key={label[0]} className="flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <p className="text-sm leading-snug font-semibold text-gray-800">{label[0]}<br />{label[1]}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
