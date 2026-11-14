/**
 * Director's signature + seal as a data URL for PDFs and print views, or ''
 * when it cannot be loaded (documents then print with a blank signature line).
 * Served to CRM staff only — see /api/crm/assets/director-seal.
 */
export async function fetchDirectorSeal(): Promise<string> {
  try {
    const res = await fetch('/api/crm/assets/director-seal')
    if (!res.ok) return ''
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}
