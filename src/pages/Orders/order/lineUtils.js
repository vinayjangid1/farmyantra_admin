/** Order line shaping for the line editor (§25.3–§25.4). */
export const toEditable = (items) => items.map((i) => ({
  item_key: i.item_key, product_id: i.product_id, description: i.description, quantity: i.quantity, unit_price_paise: i.unit_price_paise,
  original_unit_price_paise: i.unit_price_paise, discount_paise: i.discount_paise || 0, price_override_reason: '', hsn_code: i.hsn_code, tax_rate_bps: i.tax_rate_bps,
}))

/** Shape lines for the API: only send a price when it was changed. */
export const toPayload = (lines) => lines.map((l) => {
  const base = { item_key: l.item_key, quantity: Number(l.quantity), discount_paise: l.discount_paise || 0 }
  if (!l.product_id) return { ...base, description: l.description, unit_price_paise: l.unit_price_paise || 0, hsn_code: l.hsn_code || null, tax_rate_bps: l.tax_rate_bps ?? 1800 }
  const changed = l.unit_price_paise !== null && l.unit_price_paise !== undefined && l.unit_price_paise !== l.original_unit_price_paise
  return { ...base, product_id: l.product_id, ...(changed ? { unit_price_paise: l.unit_price_paise, price_override_reason: l.price_override_reason } : {}) }
})
