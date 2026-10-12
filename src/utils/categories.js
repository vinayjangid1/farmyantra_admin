/** Category options labelled "Parent › Child" for selects. */
const en = (i18n) => (i18n && typeof i18n === 'object' ? i18n.en || i18n.hi || '' : i18n || '')

export const categoryOptions = (categories = []) => {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const path = (c) => (c.parent_id && byId.get(c.parent_id) ? `${en(byId.get(c.parent_id).name_i18n)} › ${en(c.name_i18n)}` : en(c.name_i18n))
  return categories.map((c) => ({ value: c.id, label: path(c) })).sort((a, b) => a.label.localeCompare(b.label))
}
