import { AdmissionsClient } from './client'

export const metadata = { title: 'Admissions' }

export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const { track } = await searchParams
  return <AdmissionsClient initialTrack={track} />
}
