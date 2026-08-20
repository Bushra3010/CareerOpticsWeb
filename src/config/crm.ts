/**
 * CRM vocabulary — mirrors the CHECK constraints in `0006_crm_schema.sql`.
 *
 * In `config/` rather than the query layer because the client components (the
 * status select, the filter bar) need these, and importing from `lib/queries/*`
 * would drag `next/headers` into the browser bundle.
 */

export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "counselled",
  "document_received",
  "converted",
  "lost",
  "dnp",
  "switch_off",
  "not_reachable",
  "not_interested",
  "custom",
] as const;

export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];

export const CRM_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  counselled: "Counselled",
  document_received: "Documents received",
  converted: "Converted",
  lost: "Lost",
  dnp: "Did not pick up",
  switch_off: "Switched off",
  not_reachable: "Not reachable",
  not_interested: "Not interested",
  custom: "Custom",
};

/** Statuses that mean the lead is still workable, for the default inbox view. */
export const CRM_OPEN_STATUSES: CrmLeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "counselled",
  "document_received",
  "dnp",
  "switch_off",
  "not_reachable",
];

export const CRM_LEAD_SOURCES = [
  "website",
  "walk_in",
  "referral",
  "whatsapp",
  "phone",
  "excel_import",
  "social_media",
  "meta_ads",
  "ivr",
  "other",
] as const;

export type CrmLeadSource = (typeof CRM_LEAD_SOURCES)[number];

export const CRM_SOURCE_LABELS: Record<CrmLeadSource, string> = {
  website: "Website",
  walk_in: "Walk in",
  referral: "Referral",
  whatsapp: "WhatsApp",
  phone: "Phone",
  excel_import: "Excel import",
  social_media: "Social media",
  meta_ads: "Meta ads",
  ivr: "IVR",
  other: "Other",
};

export const CRM_ACTIVITY_TYPES = [
  "created",
  "status_changed",
  "assigned",
  "transferred",
  "note_added",
  "followup_set",
  "payment_received",
  "converted",
  "document_uploaded",
  "call_made",
] as const;

export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

export const CRM_ACTIVITY_LABELS: Record<CrmActivityType, string> = {
  created: "Created",
  status_changed: "Status",
  assigned: "Assigned",
  transferred: "Transferred",
  note_added: "Note",
  followup_set: "Follow-up",
  payment_received: "Payment",
  converted: "Converted",
  document_uploaded: "Document",
  call_made: "Call",
};

export const CRM_STUDENT_STATUSES = [
  "pending",
  "active",
  "completed",
  "dropped",
  "on_hold",
] as const;

export type CrmStudentStatus = (typeof CRM_STUDENT_STATUSES)[number];

export const CRM_STUDENT_STATUS_LABELS: Record<CrmStudentStatus, string> = {
  pending: "Pending approval",
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
  on_hold: "On hold",
};

export const PAYMENT_MODES = [
  "cash",
  "upi",
  "card",
  "neft",
  "rtgs",
  "cheque",
  "other",
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const CRM_MODES = [
  { value: "attending", label: "Attending" },
  { value: "non-attending", label: "Non-attending" },
] as const;

/** Payment filter on the leads list, derived from total_fee vs amount_paid. */
export const PAYMENT_FILTERS = [
  { value: "paid", label: "Fully paid" },
  { value: "partial", label: "Part paid" },
  { value: "unpaid", label: "Nothing paid" },
] as const;

export const CRM_LEADS_PAGE_SIZE = 50;
