'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/crm/lib/supabase/client'

/**
 * The website's college catalogue, read live from the `public` schema so the
 * CRM always offers exactly the colleges published on the site — add a college
 * (or a course to it) in /admin and it appears here with no extra step.
 *
 * Course options are matched to `crm.courses` by name; every website course
 * has a CRM course of the same name.
 */

export type WebsiteCollege = { id: string; name: string; city: string | null }
export type WebsiteCollegeCourse = {
  name: string
  fee_per_year: number | null
  total_fee: number | null
  duration_months: number | null
}

export function useWebsiteColleges() {
  const [colleges, setColleges] = useState<WebsiteCollege[]>([])
  useEffect(() => {
    let alive = true
    ;(createClient() as any)
      .schema('public')
      .from('colleges')
      .select('id, name, cities(name)')
      .eq('status', 'published')
      .order('name')
      .then(({ data }: { data: any[] | null }) => {
        if (!alive) return
        setColleges((data ?? []).map((c) => ({ id: c.id, name: c.name, city: c.cities?.name ?? null })))
      })
    return () => {
      alive = false
    }
  }, [])
  return colleges
}

/** Courses (with website fees) offered by one college; null when none is chosen. */
export function useCollegeCourses(collegeId: string | null | undefined) {
  const [courses, setCourses] = useState<WebsiteCollegeCourse[] | null>(null)
  useEffect(() => {
    if (!collegeId) {
      setCourses(null)
      return
    }
    let alive = true
    ;(createClient() as any)
      .schema('public')
      .from('college_courses')
      .select('fee_per_year, total_fee, duration_months, courses(name)')
      .eq('college_id', collegeId)
      .then(({ data }: { data: any[] | null }) => {
        if (!alive) return
        setCourses(
          (data ?? [])
            .filter((r) => r.courses?.name)
            .map((r) => ({
              name: r.courses.name,
              fee_per_year: r.fee_per_year,
              total_fee: r.total_fee,
              duration_months: r.duration_months,
            })),
        )
      })
    return () => {
      alive = false
    }
  }, [collegeId])
  return courses
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** "₹90,000 / year · ₹3,60,000 total · 4 yrs" for the fee hint under the course. */
export function feeHint(c: WebsiteCollegeCourse | undefined) {
  if (!c) return null
  const parts = [
    c.fee_per_year ? `${inr(c.fee_per_year)} / year` : null,
    c.total_fee ? `${inr(c.total_fee)} total` : null,
    c.duration_months ? `${+(c.duration_months / 12).toFixed(1)} yrs` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
