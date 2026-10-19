/**
 * Enquiry workspace (§10.3): configuration snapshot, contact details, status
 * transitions allowed by the server, assignment, call logging for call-backs,
 * customer messages + internal notes, notification delivery log with resend,
 * and the jump into quotation preparation.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, Link, MenuItem,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import { ArrowLeft, PhoneCall, FileText, Send, Lock, RefreshCw, UserPlus, Repeat, ShoppingCart } from 'lucide-react'

import { LoadingState, ErrorState, PageContainer } from '@/shared/components'
import { StatusChip, humanize, KeyValue } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import {
  ENQUIRY, ASSIGNABLE_MEMBERS, CHANGE_ENQUIRY_STATUS, ASSIGN_ENQUIRY, LOG_CALL, SET_REQUEST_TYPE, ADD_ENQUIRY_MESSAGE,
  RESEND_NOTIFICATION, CREATE_QUOTATION,
} from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate, formatRelativeTime } from '@/utils/dateFormatter'
import { requestTypeMeta } from './requestTypes'
import AcceptOrderRequestDialog from './AcceptOrderRequestDialog'

const OUTCOMES = [
  ['connected', 'Connected — spoke to the customer'], ['no_answer', 'No answer'], ['busy', 'Busy'],
  ['switched_off', 'Switched off / not reachable'], ['wrong_number', 'Wrong number'], ['call_back_later', 'Asked to call back later'],
]
const NEEDS_NOTE = ['rejected', 'clarification_required', 'cancelled']
const CLOSED = ['closed', 'cancelled', 'rejected', 'converted_to_order']
const SWITCH_TO = { callback: 'quotation', quotation: 'callback', both: 'callback', order: 'quotation' }

const configLines = (configuration = {}) => {
  const lines = []
  if (configuration.colour) lines.push(`Colour: ${configuration.colour.name} (${configuration.colour.code})`)
  for (const a of configuration.addons || []) lines.push(`${a.name}${a.quantity > 1 ? ` × ${a.quantity}` : ''}${a.auto_included ? ' (required)' : ''}`)
  if (configuration.personalisation?.text) {
    lines.push(`Personalisation “${configuration.personalisation.text}”${configuration.personalisation.placement ? ` on ${configuration.personalisation.placement.name}` : ''} — needs approval`)
  }
  return lines
}

const EnquiryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:enquiries:write')
  const canQuote = hasPermission('admin:quotations:write')
  const canOrder = hasPermission('admin:orders:write')
  const { data, loading, error, refetch } = useQuery(ENQUIRY, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const members = useQuery(ASSIGNABLE_MEMBERS, { skip: !canWrite })
  const { run, loading: busy } = useAction()

  const [statusDialog, setStatusDialog] = useState(null)
  const [note, setNote] = useState('')
  const [call, setCall] = useState({ outcome: 'connected', note: '', next: '' })
  const [message, setMessage] = useState('')
  const [visibility, setVisibility] = useState('customer')
  const [tab, setTab] = useState(0)
  const [accepting, setAccepting] = useState(false)

  if (loading && !data) return <LoadingState message="Loading enquiry…" />
  if (error) return <ErrorState title="Could not load enquiry" message={error.message} />
  const e = data.enquiry
  const type = requestTypeMeta(e.request_type)
  const TypeIcon = type.icon
  const isOpenOrderRequest = e.request_type === 'order' && !CLOSED.includes(e.status)

  const act = async (mutation, variables, success) => {
    const result = await run(mutation, variables, { success })
    if (result) await refetch()
    return result
  }

  const changeStatus = async () => {
    if (await act(CHANGE_ENQUIRY_STATUS, { id, status: statusDialog, note: note || null })) {
      setStatusDialog(null)
      setNote('')
    }
  }

  const createQuotation = async () => {
    const q = e.quotations.find((x) => x.status !== 'cancelled')
    if (q) return navigate(`/quotations/${q.id}`)
    const created = await run(CREATE_QUOTATION, { enquiryId: id })
    if (created) navigate(`/quotations/${created.id}`)
    return undefined
  }

  return (
    <PageContainer>
      <Button component={RouterLink} to="/enquiries" startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Enquiries</Button>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{e.enquiry_number}</Typography>
                <StatusChip status={e.status} />
                <Chip size="small" icon={<TypeIcon size={14} />} label={type.long} color={type.color} />
                {e.language === 'hi' && <Chip size="small" label="हिंदी" />}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Received {formatDate(e.created_at, 'long')} · {e.assigned_to_name ? `Assigned to ${e.assigned_to_name}` : 'Unassigned'}
                {e.callback_due_at && e.request_type === 'callback' ? ` · Call by ${formatDate(e.callback_due_at, 'short')}` : ''}
              </Typography>
            </Box>
            {canWrite && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {canOrder && isOpenOrderRequest && (
                  <Button variant="contained" color="success" startIcon={<ShoppingCart size={16} />} onClick={() => setAccepting(true)} disabled={busy || e.has_price_on_request}>
                    Accept order
                  </Button>
                )}
                {(canQuote && ['submitted', 'under_review', 'contacted', 'clarification_required', 'accepted', 'quotation_sent', 'customer_declined', 'customer_accepted'].includes(e.status)) && (
                  <Button variant="contained" startIcon={<FileText size={16} />} onClick={createQuotation} disabled={busy}>
                    {e.quotations.some((q) => q.status !== 'cancelled') ? 'Open quotation' : 'Prepare quotation'}
                  </Button>
                )}
                <TextField select size="small" label="Move to…" value="" onChange={(ev) => setStatusDialog(ev.target.value)} sx={{ minWidth: 180 }} disabled={!e.allowed_transitions.length}>
                  {e.allowed_transitions.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
                </TextField>
                <TextField
                  select size="small" label="Assign" value={e.assigned_to || ''} sx={{ minWidth: 170 }}
                  onChange={(ev) => act(ASSIGN_ENQUIRY, { id, memberId: ev.target.value || null }, 'Assignment saved')}
                  InputProps={{ startAdornment: <UserPlus size={15} style={{ marginRight: 6 }} /> }}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {(members.data?.assignableMembers || []).map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </TextField>
                <Button variant="outlined" startIcon={<Repeat size={15} />} onClick={() => act(SET_REQUEST_TYPE, { id, requestType: SWITCH_TO[e.request_type] || 'callback' }, 'Request type changed')} disabled={busy}>
                  Switch to {requestTypeMeta(SWITCH_TO[e.request_type] || 'callback').label.toLowerCase()}
                </Button>
              </Stack>
            )}
          </Stack>
          {isOpenOrderRequest && (
            <Alert severity={e.has_price_on_request ? 'warning' : 'success'} sx={{ mt: 2 }}>
              {e.has_price_on_request
                ? 'This order request has items without a fixed price. Switch it to a quotation and send one instead.'
                : 'The customer wants to order at these prices. Accept it to create the order, or move it to “Rejected” with a reason.'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Configured products (snapshot at submission)</Typography>
              {e.items.map((item) => (
                <Box key={item.id} sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{item.product_name} {item.product_model ? `· ${item.product_model}` : ''}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU {item.product_sku} · Qty {item.quantity} · GST {item.tax_rate_bps / 100}%</Typography>
                      {configLines(item.configuration).map((l) => <Typography key={l} variant="body2">• {l}</Typography>)}
                      {item.price_on_request && <Chip size="small" color="warning" label="Includes price-on-request items" sx={{ mt: 0.5 }} />}
                    </Box>
                    <Box sx={{ textAlign: 'right', minWidth: 140 }}>
                      {(item.price_breakdown || []).map((line) => (
                        <Typography key={`${line.type}-${line.code}`} variant="caption" sx={{ display: 'block' }} color="text.secondary">
                          {line.type === 'base' ? 'Base' : line.label}: {line.price_on_request ? 'on request' : formatPaise(line.amount_paise)}
                        </Typography>
                      ))}
                      <Typography sx={{ fontWeight: 800 }}>{formatPaise(item.line_subtotal_paise)}</Typography>
                      {item.line_discount_paise > 0 && <Typography variant="caption" color="success.main">−{formatPaise(item.line_discount_paise)}</Typography>}
                    </Box>
                  </Stack>
                </Box>
              ))}
              <Box sx={{ ml: 'auto', maxWidth: 320, mt: 1.5 }}>
                {[['Subtotal', e.subtotal_paise], ['Offer discount', -e.discount_paise], ['GST', e.tax_paise]].map(([label, value]) => (
                  <Stack key={label} direction="row" justifyContent="space-between"><Typography variant="body2">{label}</Typography><Typography variant="body2">{value < 0 ? `−${formatPaise(-value)}` : formatPaise(value)}</Typography></Stack>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontWeight: 800 }}>Indicative total</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(e.total_paise)}{e.has_price_on_request ? ' +' : ''}</Typography></Stack>
              </Box>
              {e.applied_promotions?.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  {e.applied_promotions.map((p) => <Chip key={p.promotion_id} size="small" color="warning" variant="outlined" label={`${p.title}${p.coupon_code ? ` (${p.coupon_code})` : ''}: −${formatPaise(p.discount_paise)}`} sx={{ mr: 0.5 }} />)}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Customer & delivery</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={4}><KeyValue label="Name">{e.contact_name}</KeyValue></Grid>
                <Grid item xs={6} md={4}><KeyValue label="Phone (verified)"><Link href={`tel:${e.contact_phone}`}>{e.contact_phone}</Link></KeyValue></Grid>
                <Grid item xs={12} md={4}><KeyValue label="Email">{e.contact_email ? <Link href={`mailto:${e.contact_email}`}>{e.contact_email}</Link> : null}</KeyValue></Grid>
                <Grid item xs={6} md={4}><KeyValue label="Best time to call">{e.preferred_call_window ? humanize(e.preferred_call_window) : null}</KeyValue></Grid>
                <Grid item xs={6} md={4}><KeyValue label="Delivery">{[e.delivery_city, e.delivery_state, e.delivery_pincode].filter(Boolean).join(', ') || null}</KeyValue></Grid>
                <Grid item xs={12} md={4}><KeyValue label="Company / GSTIN">{[e.customer?.company_name, e.customer?.gstin].filter(Boolean).join(' · ') || null}</KeyValue></Grid>
                {e.message && <Grid item xs={12}><Alert severity="info" icon={false}><strong>Customer note:</strong> {e.message}</Alert></Grid>}
                {e.customer?.internal_notes && <Grid item xs={12}><Alert severity="warning" icon={<Lock size={16} />}>{e.customer.internal_notes}</Alert></Grid>}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Consent recorded {formatDate(e.consent_at, 'long')}: “{e.consent_text}”</Typography>
            </CardContent>
          </Card>

          {e.quotations.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>Quotations</Typography>
                {e.quotations.map((q) => (
                  <Stack key={q.id} direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
                    <Link component={RouterLink} to={`/quotations/${q.id}`} sx={{ fontWeight: 700 }}>{q.quotation_number}</Link>
                    <Typography variant="body2">v{q.version_number}</Typography>
                    <Typography variant="body2">{formatPaise(q.total_paise)}</Typography>
                    <StatusChip status={q.status} />
                  </Stack>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} lg={5}>
          {canWrite && ['callback', 'both'].includes(e.request_type) && !CLOSED.includes(e.status) && (
            <Card sx={{ mb: 2, borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}><PhoneCall size={18} /> Log a call</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="Outcome" value={call.outcome} onChange={(ev) => setCall({ ...call, outcome: ev.target.value })}>
                    {OUTCOMES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                  </TextField>
                  <TextField size="small" label="Notes (internal)" multiline minRows={2} value={call.note} onChange={(ev) => setCall({ ...call, note: ev.target.value })} />
                  <TextField size="small" type="datetime-local" label="Next call-back" InputLabelProps={{ shrink: true }} value={call.next} onChange={(ev) => setCall({ ...call, next: ev.target.value })} />
                  <Button variant="contained" color="warning" disabled={busy} onClick={async () => {
                    if (await act(LOG_CALL, { id, outcome: call.outcome, note: call.note || null, nextCallbackAt: call.next ? new Date(call.next).toISOString() : null }, 'Call logged')) setCall({ outcome: 'connected', note: '', next: '' })
                  }}>Save call</Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Card>
            <Tabs value={tab} onChange={(_ev, v) => setTab(v)} variant="fullWidth">
              <Tab label={`Messages (${e.messages.length})`} />
              <Tab label="Timeline" />
              <Tab label={`Notifications (${e.deliveries.length})`} />
            </Tabs>
            <CardContent>
              {tab === 0 && (
                <Stack spacing={1}>
                  <Box sx={{ maxHeight: 380, overflowY: 'auto', display: 'grid', gap: 1 }}>
                    {e.messages.length === 0 && <Typography variant="body2" color="text.secondary">No messages yet.</Typography>}
                    {e.messages.map((m) => (
                      <Box key={m.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: m.visibility === 'internal' ? 'warning.light' : m.author_type === 'customer' ? 'action.hover' : 'primary.main', color: m.author_type !== 'customer' && m.visibility !== 'internal' ? 'primary.contrastText' : 'text.primary', ml: m.author_type === 'customer' ? 0 : 4, mr: m.author_type === 'customer' ? 4 : 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          {m.visibility === 'internal' && <Lock size={12} />} {m.author_name || humanize(m.author_type)} · {formatRelativeTime(m.created_at)}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{m.body}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {canWrite && (
                    <>
                      <TextField size="small" multiline minRows={2} placeholder={visibility === 'internal' ? 'Internal note — the customer will not see this' : 'Message to the customer (they are notified by email)'} value={message} onChange={(ev) => setMessage(ev.target.value)} />
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <TextField select size="small" value={visibility} onChange={(ev) => setVisibility(ev.target.value)}>
                          <MenuItem value="customer">To customer</MenuItem>
                          <MenuItem value="internal">Internal note</MenuItem>
                        </TextField>
                        <Button variant="contained" endIcon={<Send size={15} />} disabled={busy || !message.trim()} onClick={async () => { if (await act(ADD_ENQUIRY_MESSAGE, { id, body: message.trim(), visibility }, 'Message added')) setMessage('') }}>Send</Button>
                      </Stack>
                    </>
                  )}
                </Stack>
              )}
              {tab === 1 && (
                <Stack spacing={1.5}>
                  {e.events.map((ev) => (
                    <Box key={ev.id} sx={{ borderLeft: 3, borderColor: ev.is_customer_visible === false ? 'warning.main' : 'primary.main', pl: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {ev.to_status ? `${humanize(ev.from_status || 'new')} → ${humanize(ev.to_status)}` : humanize(ev.event_type)}
                        {ev.metadata?.outcome ? ` · ${humanize(ev.metadata.outcome)}` : ''}
                      </Typography>
                      {ev.note && <Typography variant="body2">{ev.note}</Typography>}
                      <Typography variant="caption" color="text.secondary">{ev.actor_name || humanize(ev.actor_type)} · {formatDate(ev.created_at, 'long')}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
              {tab === 2 && (
                <Stack spacing={1}>
                  {e.deliveries.length === 0 && <Typography variant="body2" color="text.secondary">No emails sent for this enquiry yet.</Typography>}
                  {e.deliveries.map((d) => (
                    <Stack key={d.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.subject}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.recipient} · {d.attempts} attempt(s){d.last_error ? ` · ${d.last_error}` : ''}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StatusChip status={d.status === 'sent' ? 'ready' : d.status === 'skipped' ? 'inactive' : d.status} label={humanize(d.status)} />
                        {canWrite && d.status !== 'sent' && <Button size="small" startIcon={<RefreshCw size={14} />} onClick={() => act(RESEND_NOTIFICATION, { deliveryId: d.id }, 'Resent')}>Resend</Button>}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {accepting && <AcceptOrderRequestDialog enquiry={e} open={accepting} onClose={() => setAccepting(false)} />}

      <Dialog open={Boolean(statusDialog)} onClose={() => setStatusDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Move to “{humanize(statusDialog)}”</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            The customer is notified after the change is saved. {NEEDS_NOTE.includes(statusDialog) ? 'A note is required and will be shown to the customer.' : 'An optional note appears on their timeline.'}
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={3} label={NEEDS_NOTE.includes(statusDialog) ? 'Note to customer (required)' : 'Note (optional)'} value={note} onChange={(ev) => setNote(ev.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
          <Button variant="contained" disabled={busy || (NEEDS_NOTE.includes(statusDialog) && !note.trim())} onClick={changeStatus}>Save & notify</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}

export default EnquiryDetail
