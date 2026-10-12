/** Money is integer paise in the API. These helpers format and convert it. */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

/** 14500000 → "₹1,45,000" */
export const formatPaise = (paise) => (paise === null || paise === undefined ? '—' : `₹${inr.format(Number(paise) / 100)}`)

/** Rupee input (string/number) → integer paise, or null when blank. */
export const rupeesToPaise = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

/** Paise → rupee number for form fields. */
export const paiseToRupees = (paise) => (paise === null || paise === undefined ? '' : Number(paise) / 100)

/** Basis points ↔ percent */
export const bpsToPercent = (bps) => (bps === null || bps === undefined ? '' : Number(bps) / 100)
export const percentToBps = (pct) => (pct === '' || pct === null || pct === undefined ? null : Math.round(Number(pct) * 100))

/** Legacy helpers expected by the shared detailKit (copied from the Raddiwalla admin). */
export const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
export const formatNumber = (v) => new Intl.NumberFormat('en-IN').format(toNumber(v))
export const formatCurrency = (v) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(toNumber(v))}`
export const formatKg = (v) => `${formatNumber(v)} kg`
