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

// ── Phase 2 vocabulary ───────────────────────────────────────────────────────
// Mirrors the CHECK constraints in migrations 0011–0022. Same reason as above:
// client components need these and must not import from lib/queries/*.

export const APPOINTMENT_TYPES = [
  { value: "office_visit", label: "Office visit" },
  { value: "google_meet", label: "Google Meet" },
] as const;

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

/** 30-minute grid, matching the fixed duration the appointments table assumes. */
export const APPOINTMENT_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const minutes = 9 * 60 + i * 30; // 09:00 → 19:30
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export const ASSOCIATE_STATUSES = ["pending", "approved", "rejected"] as const;
export type AssociateStatus = (typeof ASSOCIATE_STATUSES)[number];
export const ASSOCIATE_STATUS_LABELS: Record<AssociateStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const ASSOCIATE_RESOURCE_TYPES = [
  "brochure",
  "fee_structure",
  "admission_form",
  "marketing",
  "poster",
  "reel",
  "training",
  "other",
] as const;
export type AssociateResourceType = (typeof ASSOCIATE_RESOURCE_TYPES)[number];
export const ASSOCIATE_RESOURCE_LABELS: Record<AssociateResourceType, string> = {
  brochure: "Brochure",
  fee_structure: "Fee structure",
  admission_form: "Admission form",
  marketing: "Marketing",
  poster: "Poster",
  reel: "Reel",
  training: "Training",
  other: "Other",
};

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const DISPATCH_STATUSES = [
  "pending",
  "dispatched",
  "in_transit",
  "delivered",
  "returned",
  "failed",
] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];
export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  pending: "Pending",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  returned: "Returned",
  failed: "Failed",
};

export const DISPATCH_DIRECTIONS = [
  { value: "outbound", label: "Outbound — sent from the office" },
  { value: "inbound", label: "Inbound — received from a board" },
] as const;

export const STUDENT_DOC_TYPES = [
  "10th_marksheet",
  "12th_marksheet",
  "graduation",
  "passport",
  "sop",
  "lor",
  "ielts_scorecard",
  "pte_scorecard",
  "offer_letter",
  "visa",
  "other",
] as const;
export type StudentDocType = (typeof STUDENT_DOC_TYPES)[number];
export const STUDENT_DOC_LABELS: Record<StudentDocType, string> = {
  "10th_marksheet": "10th marksheet",
  "12th_marksheet": "12th marksheet",
  graduation: "Graduation",
  passport: "Passport",
  sop: "SOP",
  lor: "LOR",
  ielts_scorecard: "IELTS scorecard",
  pte_scorecard: "PTE scorecard",
  offer_letter: "Offer letter",
  visa: "Visa",
  other: "Other",
};

export const STUDENT_DOC_STATUSES = ["pending", "received", "verified", "rejected"] as const;
export type StudentDocStatus = (typeof STUDENT_DOC_STATUSES)[number];
export const STUDENT_DOC_STATUS_LABELS: Record<StudentDocStatus, string> = {
  pending: "Pending",
  received: "Received",
  verified: "Verified",
  rejected: "Rejected",
};

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "half_day",
  "late",
  "leave",
  "holiday",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half day",
  late: "Late",
  leave: "Leave",
  holiday: "Holiday",
};

export const LEAVE_TYPES = ["sick", "casual", "earned", "unpaid", "other"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: "Sick",
  casual: "Casual",
  earned: "Earned",
  unpaid: "Unpaid",
  other: "Other",
};

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "marketing",
  "travel",
  "salary",
  "vendor",
  "misc",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  marketing: "Marketing",
  travel: "Travel",
  salary: "Salary",
  vendor: "Vendor",
  misc: "Miscellaneous",
  other: "Other",
};

export const PAYROLL_STATUSES = ["draft", "processed", "paid"] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];
export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  draft: "Draft",
  processed: "Processed",
  paid: "Paid",
};

export const MENTORSHIP_TASK_TYPES = [
  { value: "work_assignment", label: "Work assignment" },
  { value: "practical", label: "Practical" },
  { value: "exam", label: "Exam" },
] as const;

export const TARGET_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "custom",
] as const;
export type TargetPeriod = (typeof TARGET_PERIODS)[number];
export const TARGET_PERIOD_LABELS: Record<TargetPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  custom: "Custom",
};

export const NOTIFICATION_TYPES = ["info", "warning", "success", "alert"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info: "Info",
  warning: "Warning",
  success: "Success",
  alert: "Alert",
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
