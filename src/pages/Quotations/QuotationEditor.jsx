/**
 * Quotation editor (§11). The current draft is editable: lines (description,
 * qty, unit price, discount, GST rate), delivery/installation, validity,
 * terms and notes; totals are recalculated by the server on save. Sending
 * freezes the version, renders the PDF and emails the customer. Changing a
 * price from the enquiry requires a written reason (§10.3). Older versions,
 * customer decisions and PDFs stay available read-only.
 */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Link, MenuItem,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, FormControlLabel, Switch,
} from '@mui/material'
import { ArrowLeft, Plus, Trash2, Send, Eye, Download, Copy, Ban, PackageCheck, Save } from 'lucide-react'

import { LoadingState, ErrorState, PageContainer } from '@/shared/components'
import { StatusChip, MoneyField, KeyValue } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { QUOTATION, UPDATE_QUOTATION_DRAFT, SEND_QUOTATION, REVISE_QUOTATION, CANCEL_QUOTATION, CONVERT_TO_ORDER } from '@/services/admin.api'
import { openQuotationPdf } from '@/services/files'
import { showToast } from '@/lib/toast'
import { formatPaise, bpsToPercent, percentToBps } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const TEXT_FIELDS = [
  ['payment_terms', 'Payment terms'], ['delivery_terms', 'Delivery terms'], ['warranty_notes', 'Warranty'], ['lead_time_notes', 'Lead time'],
  ['terms_and_conditions', 'Terms & conditions'], ['customer_notes', 'Note to customer'], ['internal_notes', 'Internal notes (not printed)'],
]

const blankLine = () => ({ item_type: 'other', description: '', details: '', quantity: 1, unit_price_paise: 0, discount_paise: 0, tax_rate_bps: 1800 })

/** Local (display-only) totals so the editor reacts instantly; the server recalculates on save. */
const previewTotals = (items, form) => {
  let subtotal = 0
  let discount = 0
  let tax = 0
  for (const i of items) {
    const gross = (Number(i.unit_price_paise) || 0) * (Number(i.quantity) || 0)
    const d = Math.min(gross, Number(i.discount_paise) || 0)
    subtotal += gross
    discount += d
    tax += Math.round(((gross - d) * (Number(i.tax_rate_bps) || 0)) / 10000)
  }
  const extras = (Number(form.delivery_paise) || 0) + (Number(form.installation_paise) || 0)
  tax += Math.round((extras * 1800) / 10000)
  return { subtotal, discount, tax, extras, total: subtotal - discount + extras + tax }
}

const DraftEditor = ({ quotation, version, onSaved, canWrite }) => {
  const { run, loading } = useAction()
  const [items, setItems] = useState(version.items)
  const [form, setForm] = useState({})
  const [sendOpen, setSendOpen] = useState(false)

  useEffect(() => {
    setItems(version.items.map(({ id: _id, version_id: _v, line_total_paise: _l, tax_paise: _t, ...rest }) => rest))
    setForm({
      valid_until: version.valid_until ? String(version.valid_until).slice(0, 10) : '',
      issue_date: version.issue_date ? String(version.issue_date).slice(0, 10) : '',
      language: version.language,
      delivery_paise: version.delivery_paise,
      installation_paise: version.installation_paise,
      is_inter_state: version.is_inter_state,
      place_of_supply: version.place_of_supply || '',
      change_reason: version.change_reason || '',
      ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, version[k] || ''])),
    })
  }, [version])

  const totals = useMemo(() => previewTotals(items, form), [items, form])
  const setItem = (index, patch) => setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const save = async (silent = false) => {
    const result = await run(UPDATE_QUOTATION_DRAFT, {
      versionId: version.id,
      input: {
        ...form,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price_paise: Number(i.unit_price_paise) || 0, discount_paise: Number(i.discount_paise) || 0, tax_rate_bps: Number(i.tax_rate_bps) || 0 })),
        place_of_supply: form.place_of_supply || null,
        change_reason: form.change_reason || null,
      },
    }, { success: 'Draft saved', silent })
    if (result) onSaved()
    return result
  }

  const send = async () => {
    if (!(await save(true))) return
    const result = await run(SEND_QUOTATION, { versionId: version.id }, { success: 'Quotation sent — the customer has been emailed the PDF' })
    if (result) {
      setSendOpen(false)
      onSaved()
    }
  }

  return (
    <Card sx={{ mb: 2, border: 2, borderColor: 'primary.main' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap spacing={1}>
          <Typography variant="h6">Draft — version {version.version_number}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Eye size={15} />} onClick={() => openQuotationPdf(version.id).catch((e) => showToast(e.message))}>Preview PDF</Button>
            {canWrite && <Button variant="outlined" startIcon={<Save size={15} />} disabled={loading} onClick={() => save()}>Save draft</Button>}
            {canWrite && <Button variant="contained" startIcon={<Send size={15} />} disabled={loading} onClick={() => setSendOpen(true)}>Send to customer</Button>}
          </Stack>
        </Stack>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '38%' }}>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit price (₹)</TableCell>
                <TableCell align="right">Discount (₹)</TableCell>
                <TableCell align="right">GST %</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField size="small" fullWidth value={item.description} onChange={(e) => setItem(index, { description: e.target.value })} disabled={!canWrite} />
                    <TextField size="small" fullWidth multiline placeholder="Details (optional)" value={item.details || ''} onChange={(e) => setItem(index, { details: e.target.value })} sx={{ mt: 0.5 }} disabled={!canWrite} />
                    {item.sku && <Typography variant="caption" color="text.secondary">SKU {item.sku}{item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}</Typography>}
                  </TableCell>
                  <TableCell align="right"><TextField size="small" type="number" inputProps={{ min: 1 }} sx={{ width: 70 }} value={item.quantity} onChange={(e) => setItem(index, { quantity: e.target.value })} disabled={!canWrite} /></TableCell>
                  <TableCell align="right"><MoneyField label="" paise={item.unit_price_paise} onChange={(v) => setItem(index, { unit_price_paise: v ?? 0 })} sx={{ width: 140 }} disabled={!canWrite} /></TableCell>
                  <TableCell align="right"><MoneyField label="" paise={item.discount_paise} onChange={(v) => setItem(index, { discount_paise: v ?? 0 })} sx={{ width: 130 }} disabled={!canWrite} /></TableCell>
                  <TableCell align="right"><TextField size="small" type="number" inputProps={{ min: 0, max: 100, step: 0.5 }} sx={{ width: 80 }} value={bpsToPercent(item.tax_rate_bps)} onChange={(e) => setItem(index, { tax_rate_bps: percentToBps(e.target.value) ?? 0 })} disabled={!canWrite} /></TableCell>
                  <TableCell align="right">{formatPaise(Math.max(0, (item.unit_price_paise || 0) * (item.quantity || 0) - (item.discount_paise || 0)))}</TableCell>
                  <TableCell>{canWrite && <IconButton size="small" aria-label="Remove line" onClick={() => setItems((l) => l.filter((_x, i) => i !== index))}><Trash2 size={16} /></IconButton>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {canWrite && <Button startIcon={<Plus size={15} />} onClick={() => setItems((l) => [...l, blankLine()])} sx={{ mt: 1 }}>Add line</Button>}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={7}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} md={4}><TextField size="small" fullWidth type="date" label="Issue date" InputLabelProps={{ shrink: true }} value={form.issue_date || ''} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} disabled={!canWrite} /></Grid>
              <Grid item xs={6} md={4}><TextField size="small" fullWidth type="date" label="Valid until" InputLabelProps={{ shrink: true }} value={form.valid_until || ''} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} disabled={!canWrite} /></Grid>
              <Grid item xs={12} md={4}>
                <TextField select size="small" fullWidth label="PDF language" value={form.language || 'en'} onChange={(e) => setForm({ ...form, language: e.target.value })} disabled={!canWrite}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">हिंदी (needs Hindi PDF font)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} md={4}><MoneyField label="Delivery" paise={form.delivery_paise} onChange={(v) => setForm({ ...form, delivery_paise: v ?? 0 })} disabled={!canWrite} /></Grid>
              <Grid item xs={6} md={4}><MoneyField label="Installation" paise={form.installation_paise} onChange={(v) => setForm({ ...form, installation_paise: v ?? 0 })} disabled={!canWrite} /></Grid>
              <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Place of supply" value={form.place_of_supply || ''} onChange={(e) => setForm({ ...form, place_of_supply: e.target.value })} disabled={!canWrite} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={Boolean(form.is_inter_state)} onChange={(e) => setForm({ ...form, is_inter_state: e.target.checked })} disabled={!canWrite} />} label="Inter-state supply (IGST instead of CGST + SGST)" /></Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth multiline label="Reason for price change (required if prices differ from the enquiry or previous version)" value={form.change_reason || ''} onChange={(e) => setForm({ ...form, change_reason: e.target.value })} disabled={!canWrite} />
              </Grid>
              {TEXT_FIELDS.map(([key, label]) => (
                <Grid item xs={12} md={key === 'terms_and_conditions' ? 12 : 6} key={key}>
                  <TextField size="small" fullWidth multiline minRows={2} label={label} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} disabled={!canWrite} />
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card variant="outlined">
              <CardContent>
                {[['Subtotal', totals.subtotal], ['Discount', -totals.discount], ['Delivery + installation', totals.extras], ['GST (estimate)', totals.tax]].map(([label, value]) => (
                  <Stack key={label} direction="row" justifyContent="space-between"><Typography variant="body2">{label}</Typography><Typography variant="body2">{value < 0 ? `−${formatPaise(-value)}` : formatPaise(value)}</Typography></Stack>
                ))}
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 800 }}>Total</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(totals.total)}</Typography></Stack>
                <Typography variant="caption" color="text.secondary">Saved total: {formatPaise(version.total_paise)}. The server recalculates GST per line on save.</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>

      <Dialog open={sendOpen} onClose={() => setSendOpen(false)}>
        <DialogTitle>Send {quotation.quotation_number} v{version.version_number}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The draft is saved, frozen and emailed to the customer as a PDF. They can accept or decline it online until {form.valid_until || 'the validity date'}.
            Any later change needs a new version and renewed acceptance.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={loading} onClick={send} startIcon={<Send size={15} />}>Send now</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

const VersionSummary = ({ quotation, version, canOrder, onChanged }) => {
  const { run, loading } = useAction()
  const filename = `${quotation.quotation_number}-v${version.version_number}.pdf`
  return (
    <Card sx={{ mb: 2, opacity: version.status === 'superseded' ? 0.75 : 1 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">Version {version.version_number}</Typography>
            <StatusChip status={version.status} />
            {version.sent_at && <Typography variant="caption" color="text.secondary">Sent {formatDate(version.sent_at, 'long')}</Typography>}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<Eye size={14} />} onClick={() => openQuotationPdf(version.id).catch((e) => showToast(e.message))}>View</Button>
            <Button size="small" startIcon={<Download size={14} />} onClick={() => openQuotationPdf(version.id, { download: true, filename }).catch((e) => showToast(e.message))}>PDF</Button>
            {canOrder && version.status === 'accepted' && (
              <Button size="small" variant="contained" startIcon={<PackageCheck size={14} />} disabled={loading} onClick={async () => { if (await run(CONVERT_TO_ORDER, { versionId: version.id })) onChanged() }}>Create order</Button>
            )}
          </Stack>
        </Stack>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6} md={3}><KeyValue label="Total">{formatPaise(version.total_paise)}</KeyValue></Grid>
          <Grid item xs={6} md={3}><KeyValue label="Valid until">{version.valid_until ? formatDate(version.valid_until, 'short') : null}</KeyValue></Grid>
          <Grid item xs={6} md={3}><KeyValue label="Lines">{version.items.length}</KeyValue></Grid>
          <Grid item xs={6} md={3}><KeyValue label="Change reason">{version.change_reason}</KeyValue></Grid>
        </Grid>
        {version.decision && (
          <Alert severity={version.decision.decision === 'accepted' ? 'success' : 'info'} sx={{ mt: 1.5 }}>
            Customer {version.decision.decision} on {formatDate(version.decision.created_at, 'long')} for {formatPaise(version.decision.total_paise)}
            {version.decision.reason ? ` — “${version.decision.reason}”` : ''}{version.decision.ip ? ` · IP ${version.decision.ip}` : ''}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

const QuotationEditor = () => {
  const { id } = useParams()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:quotations:write')
  const canOrder = hasPermission('admin:orders:write')
  const { data, loading, error, refetch } = useQuery(QUOTATION, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const { run, loading: busy } = useAction()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (loading && !data) return <LoadingState message="Loading quotation…" />
  if (error) return <ErrorState title="Could not load quotation" message={error.message} />
  const q = data.quotation
  const draft = q.versions.find((v) => v.status === 'draft')
  const others = q.versions.filter((v) => v.status !== 'draft')

  return (
    <PageContainer>
      <Button component={RouterLink} to="/quotations" startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Quotations</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{q.quotation_number}</Typography>
            <StatusChip status={q.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            For <Link component={RouterLink} to={`/enquiries/${q.enquiry.id}`}>{q.enquiry.enquiry_number}</Link> · {q.enquiry.contact_name} · {q.enquiry.contact_phone}
            {' · '}<Chip size="small" label={`Enquiry: ${q.enquiry.status.replace(/_/g, ' ')}`} />
          </Typography>
        </Box>
        {canWrite && q.status !== 'cancelled' && (
          <Stack direction="row" spacing={1}>
            {!draft && <Button variant="outlined" startIcon={<Copy size={15} />} disabled={busy} onClick={async () => { if (await run(REVISE_QUOTATION, { quotationId: id })) refetch() }}>Create revision</Button>}
            {q.status !== 'accepted' && <Button color="error" startIcon={<Ban size={15} />} onClick={() => setCancelOpen(true)}>Cancel quotation</Button>}
          </Stack>
        )}
      </Stack>

      {draft && <DraftEditor quotation={q} version={draft} onSaved={refetch} canWrite={canWrite} />}
      {others.map((v) => <VersionSummary key={v.id} quotation={q} version={v} canOrder={canOrder} onChanged={refetch} />)}

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cancel quotation</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline minRows={2} label="Reason (internal)" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Keep</Button>
          <Button color="error" variant="contained" disabled={!reason.trim() || busy} onClick={async () => { if (await run(CANCEL_QUOTATION, { quotationId: id, reason })) { setCancelOpen(false); refetch() } }}>Cancel quotation</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}

export default QuotationEditor
