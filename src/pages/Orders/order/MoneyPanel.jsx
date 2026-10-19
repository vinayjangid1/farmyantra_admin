/** Documents, tax invoices and offline payments for one order (§28). */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { FileText, Upload } from 'lucide-react'

import { SidebarPanel } from '@/shared/components'
import { StatusChip, humanize, MoneyField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { apolloClient } from '@/lib/graphql/client'
import { showToast } from '@/lib/toast'
import {
  ADD_ORDER_DOCUMENT, REPLACE_ORDER_DOCUMENT, WITHDRAW_ORDER_DOCUMENT, SET_ORDER_DOCUMENT_VISIBILITY, ORDER_DOCUMENT_LINK,
  RECORD_PAYMENT, VOID_PAYMENT, CREATE_INVOICE_DRAFT, INVOICE_TEMPLATES,
} from '@/services/admin.api'
import { openInvoicePdf, openSignedLink, submissionKey } from '@/services/files'
import { DOC_TYPES, PAYMENT_MODES, PAYMENT_PURPOSES } from '@/features/fulfilment/utils'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const openDocument = async (id) => {
  try {
    const { data } = await apolloClient.query({ query: ORDER_DOCUMENT_LINK, variables: { id }, fetchPolicy: 'network-only' })
    openSignedLink(data.orderDocumentLink)
  } catch (error) {
    showToast(error.message, { severity: 'error' })
  }
}

export const DocumentsSection = ({ order, refetch }) => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:order_documents:write')
  const { run, loading } = useAction()
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  const close = () => { setMode(null); setForm({}); setFile(null) }
  const save = async () => {
    let ok
    if (mode === 'add') ok = await run(ADD_ORDER_DOCUMENT, { orderId: order.id, file, input: { doc_type: form.doc_type || 'other', title: form.title, doc_number: form.doc_number || null, doc_date: form.doc_date || null, amount_paise: form.amount_paise ?? null, visibility: form.internal ? 'internal' : 'customer' } })
    if (mode?.replace) ok = await run(REPLACE_ORDER_DOCUMENT, { id: mode.replace.id, file, input: { reason: form.reason } })
    if (mode?.withdraw) ok = await run(WITHDRAW_ORDER_DOCUMENT, { id: mode.withdraw.id, reason: form.reason })
    if (ok) { close(); refetch() }
  }
  const docs = order.documents.filter((d) => d.status !== 'superseded')
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Documents</Typography>
          {canWrite && <Button size="small" startIcon={<Upload size={16} />} onClick={() => setMode('add')}>Upload</Button>}
        </Stack>
        {!docs.length && <Typography variant="body2" color="text.secondary">No documents yet. Issued invoices appear here automatically.</Typography>}
        {docs.map((d) => (
          <Stack key={d.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" sx={{ py: 1, borderBottom: 1, borderColor: 'divider', opacity: d.status === 'withdrawn' ? 0.5 : 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.title}</Typography>
              <Typography variant="caption" color="text.secondary">{d.doc_type_label} · v{d.version} · {d.visibility === 'customer' ? 'customer can see' : 'team only'} · {d.uploaded_by_name} · {formatDate(d.created_at, 'short')}{d.status === 'withdrawn' ? ' · withdrawn' : ''}</Typography>
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              <Button size="small" onClick={() => openDocument(d.id)}>Open</Button>
              {canWrite && d.status === 'current' && !d.invoice_id && (
                <>
                  <Button size="small" onClick={async () => { if (await run(SET_ORDER_DOCUMENT_VISIBILITY, { id: d.id, visibility: d.visibility === 'customer' ? 'internal' : 'customer' })) refetch() }}>{d.visibility === 'customer' ? 'Hide' : 'Share'}</Button>
                  <Button size="small" onClick={() => setMode({ replace: d })}>New version</Button>
                  <Button size="small" color="error" onClick={() => setMode({ withdraw: d })}>Withdraw</Button>
                </>
              )}
            </Stack>
          </Stack>
        ))}
      </CardContent>
      <SidebarPanel open={Boolean(mode)} onClose={close} title={mode === 'add' ? 'Upload document' : mode?.replace ? 'Upload a new version' : 'Withdraw document'} onSave={save} loading={loading}>
        <Stack spacing={2}>
          {mode === 'add' && (
            <>
              <TextField select size="small" label="Type" value={form.doc_type || 'other'} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
                {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{humanize(t)}</MenuItem>)}
              </TextField>
              <TextField size="small" required label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Grid container spacing={1.5}>
                <Grid item xs={6}><TextField size="small" fullWidth label="Number" value={form.doc_number || ''} onChange={(e) => setForm({ ...form, doc_number: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField size="small" fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.doc_date || ''} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} /></Grid>
              </Grid>
              <MoneyField label="Amount (optional)" paise={form.amount_paise} onChange={(v) => setForm({ ...form, amount_paise: v })} />
              <FormControlLabel control={<Switch checked={Boolean(form.internal)} onChange={(e) => setForm({ ...form, internal: e.target.checked })} />} label="Team only (do not share with the customer)" />
            </>
          )}
          {(mode === 'add' || mode?.replace) && (
            <Button component="label" variant="outlined" startIcon={<FileText size={16} />}>
              {file ? file.name : 'Choose PDF or image'}
              <input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
          )}
          {(mode?.replace || mode?.withdraw) && <TextField size="small" multiline minRows={2} required label="Reason (customer sees it)" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />}
        </Stack>
      </SidebarPanel>
    </Card>
  )
}

export const InvoicesSection = ({ order }) => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:invoices:write')
  const { run, loading } = useAction()
  const { data } = useQuery(INVOICE_TEMPLATES, { skip: !canWrite })
  const [templateId, setTemplateId] = useState('')
  const create = async (documentType) => {
    const inv = await run(CREATE_INVOICE_DRAFT, { orderId: order.id, documentType, templateId: templateId || null })
    if (inv?.id) navigate(`/invoices/${inv.id}`)
  }
  const confirmed = !['pending_confirmation', 'awaiting_customer_confirmation', 'cancelled'].includes(order.status)
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Tax invoices</Typography>
        {order.invoices.map((inv) => (
          <Stack key={inv.id} direction="row" spacing={1} alignItems="center" sx={{ py: 1, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{inv.invoice_number || 'Draft'} · {humanize(inv.document_type)}</Typography>
            <StatusChip status={inv.status} />
            <Typography variant="body2">{formatPaise(inv.total_paise)}</Typography>
            {inv.sent_at && <Typography variant="caption" color="text.secondary">emailed {formatDate(inv.sent_at, 'short')}</Typography>}
            <Button size="small" onClick={() => openInvoicePdf(inv.id).catch((e) => showToast(e.message, { severity: 'error' }))}>PDF</Button>
            <Button size="small" onClick={() => navigate(`/invoices/${inv.id}`)}>Open</Button>
          </Stack>
        ))}
        {canWrite && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }} alignItems={{ sm: 'center' }}>
            <TextField select size="small" label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">Default template</MenuItem>
              {(data?.invoiceTemplates || []).filter((t) => t.is_active).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </TextField>
            <Button variant="contained" disabled={loading || !confirmed} onClick={() => create('tax_invoice')}>New tax invoice</Button>
            <Button variant="outlined" disabled={loading || order.status === 'cancelled'} onClick={() => create('proforma_invoice')}>New proforma</Button>
          </Stack>
        )}
        {canWrite && !confirmed && <Typography variant="caption" color="text.secondary">Tax invoices need a confirmed order; send a proforma before that.</Typography>}
      </CardContent>
    </Card>
  )
}

export const PaymentsSection = ({ order, refetch }) => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:payments:write')
  const { run, loading } = useAction()
  const [open, setOpen] = useState(false)
  const [voiding, setVoiding] = useState(null)
  const [form, setForm] = useState({})
  const s = order.payment_summary
  const live = order.payments.filter((p) => p.status === 'recorded' && p.entry_type === 'payment')
  const defaultPurpose = live.length ? 'instalment' : 'advance'
  const start = () => { setForm({ entry_type: 'payment', purpose: defaultPurpose, mode: 'upi', paid_on: new Date().toISOString().slice(0, 10), amount_paise: s.outstanding_paise || null, idempotency_key: submissionKey() }); setOpen(true) }
  const save = async () => {
    if (voiding) {
      if (await run(VOID_PAYMENT, { id: voiding.id, reason: form.reason })) { setVoiding(null); setForm({}); refetch() }
      return
    }
    if (await run(RECORD_PAYMENT, { orderId: order.id, input: form })) { setOpen(false); refetch() }
  }
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Payments</Typography>
          {canWrite && <Button size="small" variant="contained" onClick={start}>Record payment</Button>}
        </Stack>
        <Alert severity="info" sx={{ mb: 1.5 }}>Nothing is charged online. Record money received by cash, UPI, transfer or cheque.</Alert>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Received</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(s.net_paise)}</Typography></Grid>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Outstanding</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(s.outstanding_paise)}</Typography></Grid>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Status</Typography><Box><StatusChip status={s.status} /></Box></Grid>
        </Grid>
        {order.payments.map((p) => (
          <Stack key={p.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider', opacity: p.status === 'voided' ? 0.5 : 1, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {p.payment_number} · {p.entry_type === 'refund' ? 'Refund' : humanize(p.purpose || 'instalment')} · {humanize(p.mode)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[p.reference, p.received_into && `into ${p.received_into}`, p.recorded_by_name && `by ${p.recorded_by_name}`, p.note].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <Typography variant="body2">{p.entry_type === 'refund' ? '−' : ''}{formatPaise(p.amount_paise)}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(p.paid_on, 'short')}{p.status === 'voided' ? ` · voided: ${p.void_reason}` : ''}</Typography>
            {canWrite && p.status === 'recorded' && <Button size="small" color="error" onClick={() => { setForm({}); setVoiding(p) }}>Void</Button>}
          </Stack>
        ))}
      </CardContent>
      <SidebarPanel open={open || Boolean(voiding)} onClose={() => { setOpen(false); setVoiding(null) }} title={voiding ? `Void ${voiding.payment_number}` : 'Record payment'} onSave={save} loading={loading}>
        {voiding ? (
          <TextField size="small" fullWidth multiline minRows={2} required label="Reason" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        ) : (
          <Stack spacing={2}>
            <TextField select size="small" label="Type" value={form.entry_type || 'payment'} onChange={(e) => setForm({ ...form, entry_type: e.target.value })}>
              <MenuItem value="payment">Payment received</MenuItem>
              <MenuItem value="refund">Refund paid</MenuItem>
            </TextField>
            {(form.entry_type || 'payment') === 'payment' && (
              <TextField select size="small" label="For" value={form.purpose || defaultPurpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                {PAYMENT_PURPOSES.map((p) => <MenuItem key={p} value={p}>{p === 'final' ? 'Final / balance payment' : humanize(p)}</MenuItem>)}
              </TextField>
            )}
            <MoneyField label="Amount" paise={form.amount_paise} onChange={(v) => setForm({ ...form, amount_paise: v })} />
            <TextField select size="small" label="Mode" value={form.mode || 'upi'} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {PAYMENT_MODES.map((m) => <MenuItem key={m} value={m}>{humanize(m)}</MenuItem>)}
            </TextField>
            <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.paid_on || ''} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
            <TextField size="small" label="Reference (UTR / cheque / DD number)" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <TextField size="small" label="Received into (our account)" placeholder="e.g. HDFC current a/c ••1234" value={form.received_into || ''} onChange={(e) => setForm({ ...form, received_into: e.target.value })} />
            <TextField size="small" multiline minRows={2} label="Note" value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Stack>
        )}
      </SidebarPanel>
    </Card>
  )
}

const MoneyPanel = ({ order, refetch }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} lg={6}>
      <InvoicesSection order={order} />
      <PaymentsSection order={order} refetch={refetch} />
    </Grid>
    <Grid item xs={12} lg={6}><DocumentsSection order={order} refetch={refetch} /></Grid>
  </Grid>
)

export default MoneyPanel
