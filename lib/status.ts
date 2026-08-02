import type {
  LoadStatus,
  QuoteStatus,
  AssignmentStatus,
  DocumentStatus,
  InvoiceStatus,
  PaymentStatus,
  CompanyStatus,
} from "@/lib/generated/prisma/client";

/**
 * Status → { label, tone } for every status enum in the schema — single
 * source of truth so a status means the same color everywhere it appears,
 * per context/05-ui-ux-planning.md: "Status is always a colored badge with
 * consistent meaning across the whole app (amber = action needed, blue =
 * in progress, green = complete, red = exception/blocked)."
 */
export type StatusTone = "neutral" | "amber" | "blue" | "green" | "red";

export type StatusMeta = { label: string; tone: StatusTone };

export const LOAD_STATUS_META: Record<LoadStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  quote_requested: { label: "Quote requested", tone: "amber" },
  quoted: { label: "Quoted", tone: "amber" },
  booked: { label: "Booked", tone: "blue" },
  carrier_sourcing: { label: "Sourcing carrier", tone: "amber" },
  dispatched: { label: "Dispatched", tone: "blue" },
  at_pickup: { label: "At pickup", tone: "blue" },
  picked_up: { label: "Picked up", tone: "blue" },
  in_transit: { label: "In transit", tone: "blue" },
  at_delivery: { label: "At delivery", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  invoiced: { label: "Invoiced", tone: "green" },
  paid: { label: "Paid", tone: "green" },
  closed: { label: "Closed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "red" },
  on_hold: { label: "On hold", tone: "red" },
};

export const QUOTE_STATUS_META: Record<QuoteStatus, StatusMeta> = {
  pending: { label: "Pending", tone: "amber" },
  accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  countered: { label: "Countered", tone: "amber" },
  expired: { label: "Expired", tone: "neutral" },
};

export const ASSIGNMENT_STATUS_META: Record<AssignmentStatus, StatusMeta> = {
  offered: { label: "Offered", tone: "amber" },
  accepted: { label: "Accepted", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  fell_off: { label: "Fell off", tone: "red" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const DOCUMENT_STATUS_META: Record<DocumentStatus, StatusMeta> = {
  pending_review: { label: "Pending review", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "blue" },
  partially_paid: { label: "Partially paid", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
  disputed: { label: "Disputed", tone: "red" },
  void: { label: "Void", tone: "neutral" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  pending: { label: "Pending", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const COMPANY_STATUS_META: Record<CompanyStatus, StatusMeta> = {
  pending: { label: "Pending review", tone: "amber" },
  active: { label: "Active", tone: "green" },
  suspended: { label: "Suspended", tone: "red" },
  archived: { label: "Archived", tone: "neutral" },
};
