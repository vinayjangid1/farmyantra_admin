/**
 * Payments ledger: every payment and refund across all orders — when it was
 * received, how much, how (mode + reference), what for (advance, instalment,
 * final) and into which of our accounts — with totals for the filtered range.
 * Entries are recorded on each order's Money tab.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, ExportButton, ErrorState } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { PAYMENTS_LEDGER } from '@/services/admin.api'
import { PAYMENT_MODES, PAYMENT_PURPOSES } from '@/features/fulfilment/utils'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const monthStart = () => `${new Date().toISOString().slice(0, 8)}01`

const Total = ({ label, value, color }) => (
  <Card variant="outlined">
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 800 }} color={color}>{value}</Typography>
    </CardContent>
  </Card>
)

const Payments = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState('')
  const [mode, setMode] = useState('all')
  const [purpose, setPurpose] = useState('all')
  const [entryType, setEntryType] = useState('all')
  const [status, setStatus] = useState('recorded')

  const variables = useMemo(() => ({
    search: search || undefined, from: from || undefined, to: to || undefined,
    mode: mode === 'all' ? undefined : mode, purpose: purpose === 'all' ? undefined : purpose,
    entryType: entryType === 'all' ? undefined : entryType, status,
  }), [search, from, to, mode, purpose, entryType, status])
  const list = usePagedQuery(PAYMENTS_LEDGER, 'payments', variables, { rowsPerPage: 50 })
  const totals = list.data?.payments?.totals
  const reset = (setter) => (v) => { setter(v); list.resetPage() }

  if (list.error) return <ErrorState title="Could not load payments" message={list.error.message} />

  return (
    <PageContainer>
      <PageHeader title="Payments" subtitle="Every payment received and refund paid, across all orders. Record new payments on the order's Money tab." count={list.total} />

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><Total label="Received" value={formatPaise(totals?.received_paise ?? 0)} color="success.main" /></Grid>
        <Grid item xs={6} md={3}><Total label="Refunded" value={formatPaise(totals?.refunded_paise ?? 0)} color="error.main" /></Grid>
        <Grid item xs={6} md={3}><Total label="Net" value={formatPaise(totals?.net_paise ?? 0)} /></Grid>
        <Grid item xs={6} md={3}><Total label="Entries" value={totals?.entries ?? 0} /></Grid>
      </Grid>

      <Toolbar>
        <CustomTextField label="Search" placeholder="Order, customer, phone, UTR…" value={search} onChange={(e) => reset(setSearch)(e.target.value)} sx={{ minWidth: 240 }} />
        <CustomTextField label="From" type="date" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => reset(setFrom)(e.target.value)} />
        <CustomTextField label="To" type="date" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => reset(setTo)(e.target.value)} />
        <FilterDropdown label="For" value={purpose} onChange={reset(setPurpose)} allLabel="Any purpose" options={PAYMENT_PURPOSES.map((v) => ({ value: v, label: humanize(v) }))} />
        <FilterDropdown label="Mode" value={mode} onChange={reset(setMode)} allLabel="All modes" options={PAYMENT_MODES.map((v) => ({ value: v, label: humanize(v) }))} />
        <FilterDropdown label="Type" value={entryType} onChange={reset(setEntryType)} allLabel="Payments & refunds" options={[{ value: 'payment', label: 'Payments' }, { value: 'refund', label: 'Refunds' }]} />
        <FilterDropdown label="Status" value={status} onChange={reset(setStatus)} allLabel="Recorded & voided" allValue="all" options={[{ value: 'recorded', label: 'Recorded' }, { value: 'voided', label: 'Voided' }]} />
        <ExportButton rows={list.rows} filenamePrefix="payments" columns={[
          { key: 'paid_on', label: 'Date' }, { key: 'payment_number', label: 'Payment' }, { key: 'entry_type', label: 'Type' }, { key: 'purpose', label: 'For' },
          { key: 'order_number', label: 'Order' }, { key: 'customer_name', label: 'Customer' }, { key: 'customer_phone', label: 'Phone' }, { key: 'mode', label: 'Mode' },
          { key: 'reference', label: 'Reference' }, { key: 'received_into', label: 'Received into' }, { key: 'amount_paise', label: 'Amount (paise)' },
          { key: 'recorded_by_name', label: 'Recorded by' }, { key: 'status', label: 'Status' },
        ]} />
      </Toolbar>

      <CustomTable
        tableId="payments" rows={list.rows}
        page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange}
        onRowClick={(r) => navigate(`/orders/${r.order_id}`)}
        columns={[
          { id: 'paid_on', label: 'Date', minWidth: 110, format: (v) => formatDate(v, 'short') },
          {
            id: 'payment_number', label: 'Payment', minWidth: 150,
            format: (v, r) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography>
                <Typography variant="caption" color="text.secondary">{r.entry_type === 'refund' ? 'Refund' : humanize(r.purpose || 'instalment')}</Typography>
              </Box>
            ),
          },
          {
            id: 'customer_name', label: 'Order / customer', minWidth: 180,
            format: (v, r) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.order_number}</Typography>
                <Typography variant="caption" color="text.secondary">{v} · {r.customer_phone}</Typography>
              </Box>
            ),
          },
          {
            id: 'mode', label: 'Mode & reference', minWidth: 180,
            format: (v, r) => (
              <Box>
                <Typography variant="body2">{humanize(v)}{r.reference ? ` · ${r.reference}` : ''}</Typography>
                {r.received_into && <Typography variant="caption" color="text.secondary">into {r.received_into}</Typography>}
              </Box>
            ),
          },
          {
            id: 'amount_paise', label: 'Amount', align: 'right', minWidth: 120,
            format: (v, r) => <Typography variant="body2" sx={{ fontWeight: 800 }} color={r.entry_type === 'refund' ? 'error.main' : 'text.primary'}>{r.entry_type === 'refund' ? '−' : ''}{formatPaise(v)}</Typography>,
          },
          { id: 'order_payment_status', label: 'Order paid', format: (v) => <StatusChip status={v} /> },
          { id: 'recorded_by_name', label: 'Recorded by', format: (v, r) => (r.status === 'voided' ? <StatusChip status="cancelled" label="Voided" /> : v || '—') },
        ]}
      />
    </PageContainer>
  )
}

export default Payments
