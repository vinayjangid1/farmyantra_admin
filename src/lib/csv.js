/**
 * Minimal, dependency-free CSV export for admin list screens.
 *
 * Exports the rows currently loaded on screen (a page / filtered page), NOT the
 * whole filtered dataset — a full server-side export is a separate backend job.
 * The UI should make that scope clear ("Export this page").
 */

/** Escape a single CSV cell per RFC 4180 (quote if it contains , " or newline). */
const escapeCell = (value) => {
  if (value === null || value === undefined) return ''
  let str = String(value)
  // Flatten objects/arrays to JSON so we never dump "[object Object]".
  if (typeof value === 'object') {
    try {
      str = JSON.stringify(value)
    } catch {
      str = ''
    }
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Build a CSV string from rows + a column spec.
 * @param {object[]} rows
 * @param {{ key: string, label: string, value?: (row:object)=>any }[]} columns
 */
export const toCsv = (rows, columns) => {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.value ? c.value(row) : row[c.key]))
        .join(','),
    )
    .join('\r\n')
  return `${header}\r\n${body}`
}

/** Trigger a browser download of `content` as `filename`. */
export const downloadText = (content, filename, mime = 'text/csv;charset=utf-8;') => {
  // Prepend a BOM so Excel opens UTF-8 (₹, names) correctly.
  const blob = new Blob([`\uFEFF${content}`], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Timestamped filename like `scraps_2026-10-01_1430.csv`. */
export const csvFilename = (prefix) => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${prefix}_${stamp}.csv`
}

/**
 * One-call helper: build CSV from rows+columns and download it.
 * @returns {boolean} false if there was nothing to export.
 */
export const exportRowsToCsv = (rows, columns, filenamePrefix) => {
  if (!rows?.length) return false
  downloadText(toCsv(rows, columns), csvFilename(filenamePrefix))
  return true
}
