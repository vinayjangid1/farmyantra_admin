/** Plain helpers and constants for the fulfilment screens (kept apart from components for fast refresh). */
import { formatDate } from '@/utils/dateFormatter'

export const en = (v) => (v && typeof v === 'object' ? v.en || v.hi || '' : v || '')
export const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')
export const fmtDay = (v) => (v ? formatDate(v, 'short') : '—')

export const SHIPMENT_EVENTS = [
  { value: 'preparing', label: 'Preparing / loading' },
  { value: 'picked_up', label: 'Picked up from warehouse' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'reached_location', label: 'Reached a location', location: true },
  { value: 'delayed', label: 'Delayed', note: true },
  { value: 'delay_cleared', label: 'Back on schedule' },
  { value: 'reached_destination', label: 'Reached destination (asks the customer to confirm)' },
  { value: 'note', label: 'Note', note: true },
]

export const PAYMENT_MODES = ['cash', 'upi', 'bank_transfer', 'cheque', 'demand_draft', 'card_offline', 'other']
/** What a payment was for; an order is often paid as an advance plus instalments. */
export const PAYMENT_PURPOSES = ['advance', 'instalment', 'final', 'other']
/** Modes the API requires a reference (UTR / cheque / DD number) for. */
export const REFERENCE_MODES = ['upi', 'bank_transfer', 'cheque', 'demand_draft']
export const DOC_TYPES = ['tax_invoice', 'proforma_invoice', 'credit_note', 'payment_receipt', 'eway_bill', 'lorry_receipt', 'warranty_card', 'user_manual', 'qc_report', 'delivery_challan', 'other']

export const ISSUE_STATUSES = ['open', 'in_progress', 'awaiting_customer', 'resolved', 'closed']
export const RESOLUTIONS = ['repaired', 'part_replaced', 'unit_replaced', 'redelivered', 'refund_recorded', 'no_action_needed', 'other']
