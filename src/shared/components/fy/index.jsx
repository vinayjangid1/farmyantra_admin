/**
 * FarmYantra-specific building blocks layered on the shared Raddiwalla
 * component kit: status chips, English/Hindi field pairs, money inputs,
 * paged-query hook and a few small layout helpers.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Box, Chip, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material'

import { liveQueryOptions } from '@/services/queryOptions'
import { paiseToRupees, rupeesToPaise } from '@/utils/money'

const STATUS_COLORS = {
  // enquiries
  submitted: 'info', under_review: 'warning', contacted: 'info', clarification_required: 'warning', accepted: 'primary',
  quotation_sent: 'secondary', customer_accepted: 'success', customer_declined: 'default', converted_to_order: 'success',
  rejected: 'error', cancelled: 'default', closed: 'default',
  // quotations / versions
  draft: 'default', sent: 'secondary', declined: 'default', expired: 'error', superseded: 'default',
  // orders
  pending_confirmation: 'warning', confirmed: 'info', in_production: 'info', ready_to_dispatch: 'info', dispatched: 'secondary',
  delivered: 'success', completed: 'success',
  // products / promotions / content
  published: 'success', archived: 'default', active: 'success', paused: 'warning',
  // reviews
  pending: 'warning', verified: 'success', approved: 'success', hidden: 'default', changes_requested: 'warning',
  pending_verification: 'warning', pending_moderation: 'warning',
  // misc
  queued: 'default', generating: 'warning', ready: 'success', failed: 'error', new: 'info', in_progress: 'warning',
  callback: 'warning', quotation: 'info', inactive: 'default', suspended: 'error', blocked: 'error',
}

export const humanize = (value) => String(value || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export const StatusChip = ({ status, label, size = 'small' }) => (
  <Chip size={size} color={STATUS_COLORS[status] || 'default'} variant={STATUS_COLORS[status] ? 'filled' : 'outlined'} label={label || humanize(status)} sx={{ fontWeight: 700 }} />
)

/** English + Hindi inputs for an `{ en, hi }` value (§22.6). English is required where noted. */
export const I18nField = ({ label, value = {}, onChange, multiline = false, rows = 3, requiredEn = false, helperText }) => (
  <Grid container spacing={1.5}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth size="small" label={`${label} (English)`} required={requiredEn} multiline={multiline} minRows={multiline ? rows : undefined}
        value={value?.en || ''} onChange={(e) => onChange({ ...value, en: e.target.value })} helperText={helperText}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth size="small" label={`${label} (हिंदी)`} multiline={multiline} minRows={multiline ? rows : undefined}
        value={value?.hi || ''} onChange={(e) => onChange({ ...value, hi: e.target.value })} helperText="Falls back to English when empty"
      />
    </Grid>
  </Grid>
)

/** Rupee input that stores integer paise. */
export const MoneyField = ({ label, paise, onChange, helperText, ...props }) => (
  <TextField
    size="small" fullWidth label={label} type="number" inputProps={{ step: '0.01', min: 0 }}
    value={paise === null || paise === undefined ? '' : paiseToRupees(paise)}
    onChange={(e) => onChange(rupeesToPaise(e.target.value))}
    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
    helperText={helperText}
    {...props}
  />
)

/** Paged list query for endpoints returning JSONPage. Pages are 0-based for CustomTable. */
export const usePagedQuery = (query, key, variables = {}, { rowsPerPage: initialRows = 25 } = {}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(initialRows)
  const vars = useMemo(() => ({ ...variables, page: page + 1, limit: rowsPerPage }), [variables, page, rowsPerPage])
  const result = useQuery(query, { ...liveQueryOptions(key), variables: vars })
  const pageData = result.data?.[key]
  return {
    ...result,
    rows: pageData?.items || [],
    total: pageData?.pagination?.total || 0,
    meta: pageData?.meta || null,
    page,
    rowsPerPage,
    setPage,
    onPageChange: (_e, next) => setPage(next),
    onRowsPerPageChange: (e) => {
      setRowsPerPage(Number(e.target.value))
      setPage(0)
    },
    resetPage: () => setPage(0),
  }
}

export const KeyValue = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </Typography>
    <Typography variant="body2" component="div">{children ?? '—'}</Typography>
  </Box>
)

export const Toolbar = ({ children }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
    {children}
  </Stack>
)

/** Simple pick of an i18n value for display in the admin (English first). */
export const en = (i18n) => (i18n && typeof i18n === 'object' ? i18n.en || i18n.hi || '' : i18n || '')
