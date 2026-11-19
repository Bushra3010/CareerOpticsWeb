/** Issued-document kinds — `crm.student_credentials.kind` (0031, 0033). */
export const CREDENTIAL_KINDS = [
  { value: 'allotment_letter', label: 'Allotment Letter' },
  { value: 'registration', label: 'Registration' },
  { value: 'admit_card', label: 'Admit Card' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'marksheet', label: 'Marksheet' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
] as const

export const CREDENTIAL_LABEL: Record<string, string> = Object.fromEntries(
  CREDENTIAL_KINDS.map((k) => [k.value, k.label]),
)

/** `crm.document_orders.status` (0031). */
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  payment_submitted: { label: 'Payment verification pending', color: 'bg-amber-100 text-amber-700' },
  payment_verified: { label: 'Payment verified', color: 'bg-blue-100 text-blue-700' },
  dispatched: { label: 'Dispatched', color: 'bg-violet-100 text-violet-700' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
}

export const inr = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
