/**
 * Tax invoices (§28.3, D5): drafts are created from an order, edited here,
 * issued with the next gap-free number and emailed to the customer as a PDF.
 * Templates control the PDF layout; numbering lives in the settings tab.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, LoadingState, PageContainer, PageHeader } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { INVOICES, SETTINGS, UPDATE_INVOICE_SETTINGS } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'
import InvoiceTemplates from './InvoiceTemplates'

const List = () => {
  const navigate = useNavigate()
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const variables = useMemo(() => ({ documentType: type === 'all' ? undefined : type, status: status === 'all' ? undefined : status, search: search || undefined }), [type, status, search])
  const list = usePagedQuery(INVOICES, 'invoices', variables)
  return (
    <>
      <Toolbar>
        <CustomTextField label="Search" placeholder="Number, order, customer…" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Type" value={type} onChange={(v) => { setType(v); list.resetPage() }} allLabel="All types" options={['tax_invoice', 'proforma_invoice', 'credit_note'].map((v) => ({ value: v, label: humanize(v) }))} />
        <FilterDropdown label="Status" value={status} onChange={(v) => { setStatus(v); list.resetPage() }} allLabel="All statuses" options={['draft', 'issued', 'cancelled'].map((v) => ({ value: v, label: humanize(v) }))} />
        {list.meta?.issued_total_paise !== undefined && <Typography variant="body2" color="text.secondary">Issued in view: <strong>{formatPaise(list.meta.issued_total_paise)}</strong></Typography>}
      </Toolbar>
      <CustomTable
        tableId="invoices" rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange}
        onRowClick={(r) => navigate(`/invoices/${r.id}`)}
        columns={[
          { id: 'invoice_number', label: 'Number', minWidth: 150, format: (v) => <Typography variant="body2" sx={{ fontWeight: 800 }}>{v || 'Draft'}</Typography> },
          { id: 'document_type', label: 'Type', format: (v) => humanize(v) },
          { id: 'order_number', label: 'Order' },
          { id: 'customer_name', label: 'Customer' },
          { id: 'invoice_date', label: 'Date', format: (v) => (v ? formatDate(v, 'short') : '—') },
          { id: 'total_paise', label: 'Total', align: 'right', format: (v) => formatPaise(v) },
          { id: 'status', label: 'Status', format: (v, r) => <Stack direction="row" spacing={0.5}><StatusChip status={v} />{r.sent_at && <StatusChip status="sent" label="Emailed" />}</Stack> },
        ]}
      />
    </>
  )
}

const NumberingSettings = ({ canWrite }) => {
  const { data, loading, refetch } = useQuery(SETTINGS, { fetchPolicy: 'cache-and-network' })
  const { run, loading: saving } = useAction()
  const [form, setForm] = useState(null)
  useEffect(() => { if (data?.settings?.invoicing) setForm(data.settings.invoicing) }, [data])
  if (loading && !form) return <LoadingState />
  if (!form) return <Alert severity="info">Settings are not available to you.</Alert>
  const business = data.settings.business
  const sample = (type) => `${form.prefixes?.[type] || ''}2026-27/${'1'.padStart(Number(form.number_padding) || 4, '0')}`
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <Card variant="outlined"><CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Numbering</Typography>
            <Grid container spacing={1.5}>
              {['tax_invoice', 'proforma_invoice', 'credit_note'].map((t) => (
                <Grid item xs={12} sm={4} key={t}>
                  <TextField fullWidth size="small" label={`${humanize(t)} prefix`} value={form.prefixes?.[t] || ''} disabled={!canWrite}
                    onChange={(e) => setForm({ ...form, prefixes: { ...form.prefixes, [t]: e.target.value.toUpperCase() } })} helperText={`e.g. ${sample(t)} (${sample(t).length}/16)`} />
                </Grid>
              ))}
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" type="number" label="Number digits" value={form.number_padding} disabled={!canWrite} onChange={(e) => setForm({ ...form, number_padding: Number(e.target.value) })} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" type="number" label="Payment due after (days)" value={form.default_due_days} disabled={!canWrite} onChange={(e) => setForm({ ...form, default_due_days: Number(e.target.value) })} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="Default unit" value={form.unit_label} disabled={!canWrite} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} /></Grid>
            </Grid>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Tax defaults</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="SAC for delivery/installation" value={form.services_hsn} disabled={!canWrite} onChange={(e) => setForm({ ...form, services_hsn: e.target.value })} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" type="number" label="GST % on services" value={(form.services_tax_rate_bps || 0) / 100} disabled={!canWrite} onChange={(e) => setForm({ ...form, services_tax_rate_bps: Math.round(Number(e.target.value) * 100) })} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="Your state code" value={form.state_code} disabled={!canWrite} onChange={(e) => setForm({ ...form, state_code: e.target.value })} helperText="2 digits, e.g. 23 = MP" /></Grid>
            </Grid>
            <FormControlLabel control={<Switch checked={form.round_to_rupee !== false} disabled={!canWrite} onChange={(e) => setForm({ ...form, round_to_rupee: e.target.checked })} />} label="Round the total to the nearest rupee (round-off line)" />
            <FormControlLabel control={<Switch checked={Boolean(form.auto_send_on_issue)} disabled={!canWrite} onChange={(e) => setForm({ ...form, auto_send_on_issue: e.target.checked })} />} label="Email the PDF to the customer automatically when issued" />
            {canWrite && <Box><Button variant="contained" disabled={saving} onClick={async () => { if (await run(UPDATE_INVOICE_SETTINGS, { value: form })) refetch() }}>Save invoice settings</Button></Box>}
          </Stack>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Alert severity={business.gstin ? 'success' : 'warning'}>
          {business.gstin
            ? <>Supplier on invoices: <strong>{business.legal_name || business.name}</strong>, GSTIN {business.gstin}, {business.state}.</>
            : <>Set your legal name, address, state and GSTIN in <strong>Settings → Business</strong> before issuing tax invoices.</>}
        </Alert>
        <Alert severity="info" sx={{ mt: 2 }}>Numbers are gap-free per type and financial year (April–March) and never reused. Correct an issued invoice with a credit note; cancelled invoices keep their number.</Alert>
      </Grid>
    </Grid>
  )
}

const Invoices = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:invoices:write')
  const [tab, setTab] = useState('list')
  return (
    <PageContainer>
      <PageHeader title="Tax invoices" subtitle="GST invoices, proforma invoices and credit notes — created from orders, emailed to customers as PDF." />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
        <Tab value="list" label="Invoices" />
        <Tab value="templates" label="Templates" />
        <Tab value="settings" label="Numbering & tax" />
      </Tabs>
      {tab === 'list' && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>To bill an order, open it → “Invoices, payments & documents” → New tax invoice.</Alert>
          <List />
        </>
      )}
      {tab === 'templates' && <InvoiceTemplates canWrite={canWrite} />}
      {tab === 'settings' && <NumberingSettings canWrite={canWrite} />}
    </PageContainer>
  )
}

export default Invoices
