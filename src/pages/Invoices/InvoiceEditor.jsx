/**
 * One invoice / proforma / credit note. Drafts are editable (buyer GSTIN,
 * place of supply, lines, dates, notes, template). Issuing assigns the next
 * gap-free number, locks the document, shares it on the order and — when
 * chosen — emails the PDF to the customer.
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, Divider, Grid, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { ArrowLeft, Download, Eye, Mail, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog, ErrorState, LoadingState, PageContainer } from '@/shared/components'
import { StatusChip, humanize, KeyValue, MoneyField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { showToast } from '@/lib/toast'
import { INVOICE, INVOICE_TEMPLATES, UPDATE_INVOICE_DRAFT, ISSUE_INVOICE, SEND_INVOICE, CANCEL_INVOICE, CREATE_CREDIT_NOTE } from '@/services/admin.api'
import { openInvoicePdf } from '@/services/files'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

const Totals = ({ inv }) => {
  const rows = [
    ['Subtotal', inv.subtotal_paise], ['Discount', -inv.discount_paise], ['Reward points', -inv.points_discount_paise], ['Taxable value', inv.taxable_paise],
    ...(inv.is_inter_state ? [['IGST', inv.igst_paise]] : [['CGST', inv.cgst_paise], ['SGST', inv.sgst_paise]]),
    ['Round off', inv.round_off_paise],
  ].filter(([, v]) => v)
  return (
    <Box sx={{ ml: 'auto', maxWidth: 360 }}>
      {rows.map(([k, v]) => <Stack key={k} direction="row" justifyContent="space-between"><Typography variant="body2">{k}</Typography><Typography variant="body2">{v < 0 ? '−' : ''}{formatPaise(Math.abs(v))}</Typography></Stack>)}
      <Divider sx={{ my: 0.5 }} />
      <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 800 }}>Total</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(inv.total_paise)}</Typography></Stack>
      <Typography variant="caption" color="text.secondary">{inv.amount_in_words}</Typography>
    </Box>
  )
}

const InvoiceEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:invoices:write')
  const { data, loading, error, refetch } = useQuery(INVOICE, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const { data: tpl } = useQuery(INVOICE_TEMPLATES)
  const { run, loading: busy } = useAction()
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reason, setReason] = useState('')
  const inv = data?.invoice

  useEffect(() => {
    if (!inv) return
    setForm({
      buyer: inv.buyer || {}, place_of_supply: inv.place_of_supply || '', invoice_date: inv.invoice_date || '', due_date: inv.due_date || '',
      notes: inv.notes || '', terms: inv.terms || '', template_id: inv.template_id, reverse_charge: Boolean(inv.reverse_charge), reason: inv.reason || '',
      items: inv.items.map((i) => ({ order_item_id: i.order_item_id, item_type: i.item_type, description: i.description, details: i.details, hsn_code: i.hsn_code || '', sku: i.sku, unit: i.unit, quantity: i.quantity, unit_price_paise: i.unit_price_paise, discount_paise: i.discount_paise, tax_rate_bps: i.tax_rate_bps })),
    })
  }, [inv])

  if (loading && !inv) return <LoadingState message="Loading invoice…" />
  if (error) return <ErrorState title="Could not load invoice" message={error.message} />
  if (!inv || !form) return null

  const draft = inv.status === 'draft'
  const editable = draft && canWrite
  const patchItem = (idx, p) => setForm({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) })
  const save = () => run(UPDATE_INVOICE_DRAFT, { id, input: { ...form, invoice_date: form.invoice_date || null, due_date: form.due_date || null } }).then((r) => { if (r) refetch(); return r })
  const pdf = (download) => openInvoicePdf(id, { download, filename: `${(inv.invoice_number || 'draft').replace(/\//g, '-')}.pdf` }).catch((e) => showToast(e.message, { severity: 'error' }))
  const act = async () => {
    let ok
    if (confirm === 'issue' || confirm === 'issue_send') {
      if (!(await save())) return setConfirm(null)
      ok = await run(ISSUE_INVOICE, { id, send: confirm === 'issue_send' })
    }
    if (confirm === 'send') ok = await run(SEND_INVOICE, { id })
    if (confirm === 'cancel') ok = await run(CANCEL_INVOICE, { id, reason })
    if (confirm === 'credit') {
      const note = await run(CREATE_CREDIT_NOTE, { invoiceId: id, reason, items: [] })
      if (note?.id) { setConfirm(null); navigate(`/invoices/${note.id}`); return }
    }
    if (ok) { setConfirm(null); setReason(''); refetch() }
  }
  const title = humanize(inv.document_type)

  return (
    <PageContainer>
      <Button component={RouterLink} to={`/orders/${inv.order_id}?tab=money`} startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Order {inv.order_number}</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>{inv.invoice_number || `${title} (draft)`}</Typography>
          <StatusChip status={inv.status} />
          {inv.sent_at && <StatusChip status="sent" label={`Emailed ${inv.sent_count}×`} />}
          {inv.original_invoice_number && <Typography variant="body2" color="text.secondary">against {inv.original_invoice_number}</Typography>}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button startIcon={<Eye size={16} />} onClick={() => pdf(false)}>Preview PDF</Button>
          {!draft && <Button startIcon={<Download size={16} />} onClick={() => pdf(true)}>Download</Button>}
          {editable && <Button variant="outlined" disabled={busy} onClick={save}>Save draft</Button>}
          {editable && <Button variant="outlined" disabled={busy} onClick={() => setConfirm('issue')}>Issue</Button>}
          {editable && <Button variant="contained" startIcon={<Mail size={16} />} disabled={busy} onClick={() => setConfirm('issue_send')}>Issue & email</Button>}
          {canWrite && inv.status === 'issued' && <Button variant="contained" startIcon={<Mail size={16} />} disabled={busy} onClick={() => setConfirm('send')}>{inv.sent_at ? 'Email again' : 'Email to customer'}</Button>}
          {canWrite && inv.status === 'issued' && inv.document_type === 'tax_invoice' && <Button disabled={busy} onClick={() => setConfirm('credit')}>Credit note</Button>}
          {canWrite && inv.status !== 'cancelled' && <Button color="error" disabled={busy} onClick={() => setConfirm('cancel')}>{draft ? 'Discard' : 'Cancel'}</Button>}
        </Stack>
      </Stack>
      {draft && !inv.supplier?.gstin && inv.document_type === 'tax_invoice' && <Alert severity="warning" sx={{ mb: 2 }}>Your GSTIN is missing — set it in Settings → Business, then recreate the draft.</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Lines</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200 }}>Description</TableCell><TableCell>HSN/SAC</TableCell><TableCell align="right">Qty</TableCell>
                      <TableCell align="right" sx={{ minWidth: 120 }}>Rate</TableCell><TableCell align="right" sx={{ minWidth: 110 }}>Discount</TableCell><TableCell align="right">GST %</TableCell>
                      {editable && <TableCell />}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{editable ? <TextField size="small" fullWidth value={it.description} onChange={(e) => patchItem(idx, { description: e.target.value })} helperText={it.details} /> : <>{it.description}<Typography variant="caption" display="block" color="text.secondary">{it.details}</Typography></>}</TableCell>
                        <TableCell>{editable ? <TextField size="small" sx={{ width: 100 }} value={it.hsn_code} onChange={(e) => patchItem(idx, { hsn_code: e.target.value })} error={inv.document_type === 'tax_invoice' && !it.hsn_code} /> : it.hsn_code}</TableCell>
                        <TableCell align="right">{editable ? <TextField size="small" type="number" sx={{ width: 72 }} value={it.quantity} onChange={(e) => patchItem(idx, { quantity: Number(e.target.value) })} /> : `${it.quantity} ${it.unit || ''}`}</TableCell>
                        <TableCell align="right">{editable ? <MoneyField label="" paise={it.unit_price_paise} onChange={(v) => patchItem(idx, { unit_price_paise: v ?? 0 })} /> : formatPaise(it.unit_price_paise)}</TableCell>
                        <TableCell align="right">{editable ? <MoneyField label="" paise={it.discount_paise} onChange={(v) => patchItem(idx, { discount_paise: v ?? 0 })} /> : formatPaise(it.discount_paise)}</TableCell>
                        <TableCell align="right">{editable ? <TextField size="small" type="number" sx={{ width: 72 }} value={it.tax_rate_bps / 100} onChange={(e) => patchItem(idx, { tax_rate_bps: Math.round(Number(e.target.value) * 100) })} /> : `${it.tax_rate_bps / 100}%`}</TableCell>
                        {editable && <TableCell><IconButton aria-label="Remove line" onClick={() => setForm({ ...form, items: form.items.filter((_x, i) => i !== idx) })}><Trash2 size={16} /></IconButton></TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {editable && <Button size="small" startIcon={<Plus size={14} />} sx={{ mt: 1 }} onClick={() => setForm({ ...form, items: [...form.items, { item_type: 'service', description: '', hsn_code: '', quantity: 1, unit: 'Job', unit_price_paise: 0, discount_paise: 0, tax_rate_bps: 1800 }] })}>Add line</Button>}
              <Box sx={{ mt: 2 }}><Totals inv={inv} /></Box>
              {editable && <Typography variant="caption" color="text.secondary">Totals refresh when you save the draft.</Typography>}
            </CardContent>
          </Card>
          {inv.tax_summary?.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>Tax summary</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>HSN/SAC</TableCell><TableCell align="right">Taxable</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">{inv.is_inter_state ? 'IGST' : 'CGST + SGST'}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {inv.tax_summary.map((t) => (
                      <TableRow key={`${t.hsn_code}-${t.rate_bps}`}><TableCell>{t.hsn_code}</TableCell><TableCell align="right">{formatPaise(t.taxable_paise)}</TableCell><TableCell align="right">{t.rate_bps / 100}%</TableCell><TableCell align="right">{formatPaise(t.tax_paise)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Buyer</Typography>
              <Stack spacing={1.25}>
                {['name', 'gstin', 'address', 'city', 'state', 'pincode', 'phone', 'email'].map((k) => (editable
                  ? <TextField key={k} size="small" label={k === 'gstin' ? 'GSTIN (for B2B input credit)' : humanize(k)} value={form.buyer[k] || ''} onChange={(e) => setForm({ ...form, buyer: { ...form.buyer, [k]: e.target.value } })} />
                  : <KeyValue key={k} label={humanize(k)}>{inv.buyer?.[k]}</KeyValue>))}
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Details</Typography>
              <Stack spacing={1.25}>
                {editable ? (
                  <>
                    <TextField select size="small" label="Place of supply" value={form.place_of_supply} onChange={(e) => setForm({ ...form, place_of_supply: e.target.value })} helperText={`Supplier state ${inv.supplier?.state || '—'} — same state → CGST + SGST, otherwise IGST`}>
                      {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                    <Grid container spacing={1}>
                      <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Invoice date" InputLabelProps={{ shrink: true }} value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Due date" InputLabelProps={{ shrink: true }} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Grid>
                    </Grid>
                    <TextField select size="small" label="Template" value={form.template_id || ''} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
                      {(tpl?.invoiceTemplates || []).filter((t) => t.is_active && t.document_types.includes(inv.document_type)).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                    </TextField>
                    {inv.document_type === 'credit_note' && <TextField size="small" label="Reason for credit" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />}
                    <TextField size="small" multiline minRows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <TextField size="small" multiline minRows={2} label="Terms (leave empty to use the template's)" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
                  </>
                ) : (
                  <>
                    <KeyValue label="Place of supply">{inv.place_of_supply} ({inv.place_of_supply_code})</KeyValue>
                    <KeyValue label="Invoice date">{inv.invoice_date}</KeyValue>
                    <KeyValue label="Due date">{inv.due_date}</KeyValue>
                    <KeyValue label="Issued">{inv.issued_at ? formatDate(inv.issued_at, 'long') : '—'}</KeyValue>
                    {inv.cancel_reason && <KeyValue label="Cancelled">{inv.cancel_reason}</KeyValue>}
                  </>
                )}
                <KeyValue label="Supplier GSTIN">{inv.supplier?.gstin}</KeyValue>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={act} loading={busy}
        severity={confirm === 'cancel' ? 'error' : 'info'}
        title={{ issue: `Issue this ${title.toLowerCase()}?`, issue_send: `Issue and email to ${inv.customer_email || 'the customer'}?`, send: `Email the PDF to ${inv.customer_email || 'the customer'}?`, cancel: draft ? 'Discard this draft?' : `Cancel ${inv.invoice_number}?`, credit: 'Raise a credit note?' }[confirm] || ''}
        confirmLabel={{ issue: 'Issue', issue_send: 'Issue & email', send: 'Send', cancel: draft ? 'Discard' : 'Cancel invoice', credit: 'Create draft' }[confirm] || 'OK'}
        message={['cancel', 'credit'].includes(confirm)
          ? <TextField fullWidth size="small" multiline minRows={2} required label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1 }} />
          : confirm?.startsWith('issue') ? 'The next number is assigned and the invoice is locked. It appears in the customer\'s order documents.' : 'The customer receives an email with the PDF attached.'}
      />
    </PageContainer>
  )
}

export default InvoiceEditor
