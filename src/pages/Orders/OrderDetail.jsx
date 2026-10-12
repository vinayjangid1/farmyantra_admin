import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Box, Button, Card, CardContent, Grid, Link, MenuItem, Stack, TextField, Typography, Alert } from '@mui/material'
import { ArrowLeft } from 'lucide-react'

import { LoadingState, ErrorState, PageContainer } from '@/shared/components'
import { StatusChip, humanize, KeyValue, MoneyField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { ORDER, CHANGE_ORDER_STATUS, UPDATE_ORDER } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const OrderDetail = () => {
  const { id } = useParams()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:orders:write')
  const { data, loading, error, refetch } = useQuery(ORDER, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const { run, loading: busy } = useAction()
  const [next, setNext] = useState('')
  const [note, setNote] = useState('')
  const [form, setForm] = useState({})

  const order = data?.order
  useEffect(() => {
    if (order) {
      setForm({
        expected_delivery_date: order.expected_delivery_date ? String(order.expected_delivery_date).slice(0, 10) : '',
        tracking_reference: order.tracking_reference || '',
        payment_status: order.payment_status,
        amount_received_paise: order.amount_received_paise,
        internal_notes: order.internal_notes || '',
        customer_notes: order.customer_notes || '',
      })
    }
  }, [order])

  if (loading && !data) return <LoadingState message="Loading order…" />
  if (error) return <ErrorState title="Could not load order" message={error.message} />

  return (
    <PageContainer>
      <Button component={RouterLink} to="/orders" startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Orders</Button>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{order.order_number}</Typography>
        <StatusChip status={order.status} />
        {order.enquiry_id && <Link component={RouterLink} to={`/enquiries/${order.enquiry_id}`}>Enquiry</Link>}
        {order.quotation_id && <Link component={RouterLink} to={`/quotations/${order.quotation_id}`}>Quotation</Link>}
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
              {order.items.map((i) => (
                <Stack key={i.id} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Box><Typography sx={{ fontWeight: 700 }}>{i.description}</Typography><Typography variant="caption" color="text.secondary">SKU {i.sku} · Qty {i.quantity}</Typography></Box>
                  <Typography sx={{ fontWeight: 700 }}>{formatPaise(i.line_total_paise)}</Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}><Typography sx={{ fontWeight: 800 }}>Total (incl. GST)</Typography><Typography sx={{ fontWeight: 800 }}>{formatPaise(order.total_paise)}</Typography></Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>History</Typography>
              {order.events.map((e) => (
                <Box key={e.id} sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 1.5, mb: 1.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{humanize(e.to_status)}</Typography>
                  {e.note && <Typography variant="body2">{e.note}</Typography>}
                  <Typography variant="caption" color="text.secondary">{e.actor_name || humanize(e.actor_type)} · {formatDate(e.created_at, 'long')}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          {canWrite && order.allowed_transitions.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>Update status</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="New status" value={next} onChange={(e) => setNext(e.target.value)}>
                    {order.allowed_transitions.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
                  </TextField>
                  <TextField size="small" multiline label={next === 'cancelled' ? 'Cancellation reason (required)' : 'Note to customer (optional)'} value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button variant="contained" disabled={!next || busy || (next === 'cancelled' && !note.trim())} onClick={async () => { if (await run(CHANGE_ORDER_STATUS, { id, status: next, note: note || null })) { setNext(''); setNote(''); refetch() } }}>Save & notify customer</Button>
                </Stack>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Delivery & payment</Typography>
              <Alert severity="info" sx={{ mb: 1.5 }}>Payments are arranged offline; record them here for reference.</Alert>
              <Stack spacing={1.5}>
                <TextField size="small" type="date" label="Expected delivery" InputLabelProps={{ shrink: true }} value={form.expected_delivery_date || ''} onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} disabled={!canWrite} />
                <TextField size="small" label="Tracking / vehicle reference" value={form.tracking_reference || ''} onChange={(e) => setForm({ ...form, tracking_reference: e.target.value })} disabled={!canWrite} />
                <TextField select size="small" label="Payment status" value={form.payment_status || 'not_recorded'} onChange={(e) => setForm({ ...form, payment_status: e.target.value })} disabled={!canWrite}>
                  {['not_recorded', 'partial', 'paid', 'refunded'].map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
                </TextField>
                <MoneyField label="Amount received" paise={form.amount_received_paise} onChange={(v) => setForm({ ...form, amount_received_paise: v ?? 0 })} disabled={!canWrite} />
                <TextField size="small" multiline minRows={2} label="Internal notes" value={form.internal_notes || ''} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} disabled={!canWrite} />
                <KeyValue label="Ship to">{[order.shipping_address?.name, order.shipping_address?.phone, order.shipping_address?.address, order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.pincode].filter(Boolean).join(', ')}</KeyValue>
                {canWrite && <Button variant="outlined" disabled={busy} onClick={async () => { if (await run(UPDATE_ORDER, { id, input: { ...form, expected_delivery_date: form.expected_delivery_date || null } })) refetch() }}>Save</Button>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

export default OrderDetail
