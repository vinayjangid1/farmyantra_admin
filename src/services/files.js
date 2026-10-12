/** Authenticated PDF download for staff (token sent as a header, never in the URL). */
import { GRAPHQL_ENDPOINT } from '@/core/config/env'
import { getToken } from '@/services/auth.service'

const apiOrigin = () => new URL(GRAPHQL_ENDPOINT).origin

export const openQuotationPdf = async (versionId, { download = false, filename = 'quotation.pdf' } = {}) => {
  const res = await fetch(`${apiOrigin()}/files/quotations/${versionId}?scope=admin`, { headers: { Authorization: `Bearer ${getToken()}` } })
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
}

export const reviewMediaUrl = async (mediaId) => {
  const res = await fetch(`${apiOrigin()}/files/review-media/${mediaId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Could not load media')
  return URL.createObjectURL(await res.blob())
}

export const publicFileUrl = (path) => `${apiOrigin()}${path}`

/** Stored media URLs are absolute in production; tolerate relative ones in dev. */
export const mediaUrl = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : publicFileUrl(url.startsWith('/') ? url : `/${url}`))
