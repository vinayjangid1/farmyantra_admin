/** What the customer asked for on an enquiry: label, icon and colour for chips and filters. */
import { PhoneCall, FileText, ShoppingCart, Layers } from 'lucide-react'

export const REQUEST_TYPES = {
  callback: { label: 'Call-back', long: 'Wants a call-back', icon: PhoneCall, color: 'warning' },
  quotation: { label: 'Quotation', long: 'Wants a quotation', icon: FileText, color: 'info' },
  both: { label: 'Call + quotation', long: 'Wants a call-back and a quotation', icon: Layers, color: 'secondary' },
  order: { label: 'Order', long: 'Wants to order', icon: ShoppingCart, color: 'success' },
}

export const requestTypeMeta = (type) => REQUEST_TYPES[type] || REQUEST_TYPES.quotation

export const REQUEST_TYPE_OPTIONS = Object.entries(REQUEST_TYPES).map(([value, meta]) => ({ value, label: meta.label }))
