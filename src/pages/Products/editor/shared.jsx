/** Small helpers shared by the product editor tabs. */
import { useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'

/** Local form state seeded once from the server copy. */
export const useForm = (initial) => {
  const [form, setForm] = useState(initial)
  const set = (key) => (eOrValue) => {
    const value = eOrValue?.target ? (eOrValue.target.type === 'checkbox' ? eOrValue.target.checked : eOrValue.target.value) : eOrValue
    setForm((f) => ({ ...f, [key]: value }))
  }
  return [form, set, setForm]
}

/** '' → null, numeric strings → numbers. */
export const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
export const int = (v) => (v === '' || v === null || v === undefined ? null : parseInt(v, 10))

export const Section = ({ title, subtitle, children, action }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
    {children}
  </Box>
)

export const SaveBar = ({ onSave, disabled, loading, label = 'Save changes' }) => (
  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
    <Button variant="contained" onClick={onSave} disabled={disabled || loading}>{loading ? 'Saving…' : label}</Button>
  </Stack>
)

/** Text area ↔ string array, one entry per line. */
export const linesToList = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean)
export const listToLines = (list) => (Array.isArray(list) ? list.join('\n') : '')
