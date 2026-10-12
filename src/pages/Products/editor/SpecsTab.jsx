import { useState } from 'react'
import { Box, Button, Checkbox, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

import { useAction } from '@/shared/hooks/useAction'
import { SAVE_SPECS } from '@/services/admin.api'
import { Section, SaveBar } from './shared'

const blank = () => ({ group_i18n: { en: '', hi: '' }, label_i18n: { en: '', hi: '' }, value_i18n: { en: '', hi: '' }, unit: '', is_key_spec: false })

const SpecsTab = ({ product, refetch, canWrite }) => {
  const [rows, setRows] = useState(product.specs.length ? product.specs.map((s) => ({ ...blank(), ...s, unit: s.unit || '' })) : [blank()])
  const { run, loading } = useAction()
  const update = (i, key, lang) => (e) => setRows((rs) => rs.map((r, idx) => {
    if (idx !== i) return r
    if (lang) return { ...r, [key]: { ...r[key], [lang]: e.target.value } }
    return { ...r, [key]: key === 'is_key_spec' ? e.target.checked : e.target.value }
  }))
  const move = (i, d) => setRows((rs) => {
    const next = [...rs]
    const [row] = next.splice(i, 1)
    next.splice(i + d, 0, row)
    return next
  })
  const save = async () => {
    const specs = rows.filter((r) => r.label_i18n.en.trim() || r.value_i18n.en.trim())
    if (await run(SAVE_SPECS, { productId: product.id, specs }, { success: 'Specifications saved' })) refetch()
  }
  const cell = (i, key, lang, label, width) => (
    <TextField size="small" label={label} value={rows[i][key][lang] || ''} onChange={update(i, key, lang)} disabled={!canWrite} sx={{ width }} inputProps={{ lang }} />
  )
  return (
    <Section
      title="Specification table"
      subtitle="Grouped on the product page. Tick “Key” for the 3–6 specs shown on cards and in comparisons."
      action={canWrite && <Button startIcon={<Plus size={16} />} onClick={() => setRows((r) => [...r, blank()])}>Add row</Button>}
    >
      <Stack spacing={1.5}>
        {rows.map((r, i) => (
          <Box key={i} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              {cell(i, 'group_i18n', 'en', 'Group', 150)}
              {cell(i, 'label_i18n', 'en', 'Label *', 180)}
              {cell(i, 'value_i18n', 'en', 'Value *', 180)}
              <TextField size="small" label="Unit" value={r.unit} onChange={update(i, 'unit')} disabled={!canWrite} sx={{ width: 90 }} />
              <Tooltip title="Key spec"><Stack direction="row" alignItems="center"><Checkbox checked={r.is_key_spec} onChange={update(i, 'is_key_spec')} disabled={!canWrite} /><Typography variant="caption">Key</Typography></Stack></Tooltip>
              {canWrite && (
                <Stack direction="row" sx={{ ml: 'auto' }}>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={16} /></IconButton>
                  <IconButton size="small" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={16} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setRows((rs) => rs.filter((_r, idx) => idx !== i))} aria-label="Remove"><Trash2 size={16} /></IconButton>
                </Stack>
              )}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {cell(i, 'group_i18n', 'hi', 'समूह', 150)}
              {cell(i, 'label_i18n', 'hi', 'लेबल', 180)}
              {cell(i, 'value_i18n', 'hi', 'मान', 180)}
            </Stack>
          </Box>
        ))}
      </Stack>
      {canWrite && <SaveBar onSave={save} loading={loading} label="Save specifications" />}
    </Section>
  )
}

export default SpecsTab
