/** Authenticated PDF download for staff (token sent as a header, never in the URL). */
import { GRAPHQL_ENDPOINT } from '@/core/config/env'
import { getToken } from '@/services/auth.service'
import { markBusy } from '@/lib/busyButton'

/** Shows a spinner on the clicked button while a file download runs. */
const withBusy = (fn) => async (...args) => {
  const release = markBusy()
  try {
    return await fn(...args)
  } finally {
    release()
  }
}

/** API base URL, including any path prefix (e.g. https://farmyantra.in/api). */
const apiBase = () => GRAPHQL_ENDPOINT.replace(/\/admin\/graphql\/?$/, '')

export const openQuotationPdf = withBusy(async (versionId, { download = false, filename = 'quotation.pdf' } = {}) => {
  const res = await fetch(`${apiBase()}/files/quotations/${versionId}?scope=admin`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Could not load the PDF')
  const url = URL.createObjectURL(await res.blob())
  if (download) {
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(a)
    a.click()
    a.remove()
  } else {
    window.open(url, '_blank', 'noopener')
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
})

export const reviewMediaUrl = async (mediaId) => {
  const res = await fetch(`${apiBase()}/files/review-media/${mediaId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Could not load media')
  return URL.createObjectURL(await res.blob())
}

export const publicFileUrl = (path) => `${apiBase()}${path}`

/** Stored media URLs are absolute in production; tolerate relative ones in dev. */
export const mediaUrl = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : publicFileUrl(url.startsWith('/') ? url : `/${url}`))

const openBlob = (blob, { download = false, filename = 'file.pdf' } = {}) => {
  const url = URL.createObjectURL(blob)
  if (download) {
    const a = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(a)
    a.click()
    a.remove()
  } else {
    window.open(url, '_blank', 'noopener')
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Invoice / credit note PDF (drafts carry a DRAFT watermark). */
export const openInvoicePdf = withBusy(async (invoiceId, { download = false, filename = 'invoice.pdf' } = {}) => {
  const res = await fetch(`${apiBase()}/files/invoices/${invoiceId}?scope=admin`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Could not load the PDF')
  openBlob(await res.blob(), { download, filename })
})

/** A PDF returned as base64 by GraphQL (template previews). */
export const openBase64Pdf = ({ base64, filename = 'preview.pdf' }) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  openBlob(new Blob([bytes], { type: 'application/pdf' }), { filename })
}

/** Driver ID files: staff with driver_identity:read only; every view is audited. */
export const driverIdentityUrl = async (fileId) => {
  const res = await fetch(`${apiBase()}/files/driver-identity/${fileId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Could not load the file')
  return URL.createObjectURL(await res.blob())
}

/** A short-lived signed link from the API (order documents, progress media). */
export const openSignedLink = (link) => window.open(link.url, '_blank', 'noopener')

/** Submission key for idempotent writes (payments, order changes). */
export const submissionKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, '').slice(0, 32)
