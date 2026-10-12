/** Items, totals, versions and the change workflow (§25). */
import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, TextField, Typography } from '@mui/material'

import { SidebarPanel } from '@/shared/components'
import { StatusChip, humanize, KeyValue, MoneyField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { PROPOSE_ORDER_REVISION, WITHDRAW_ORDER_REVISION, RECORD_PHONE_CONFIRMATION } from '@/services/admin.api'
import { submissionKey } from '@/services/files'
import { VersionDiff } from '@/features/fulfilment'
import { fmtDay } from '@/features/fulfilment/utils'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'
import LineEditor from './LineEditor'
import { toEditable, toPayload } from './lineUtils'

const Row = ({ label, value, strong, negative }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
    <Typography variant="body2" sx={{ fontWeight: strong ? 800 : 400 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: strong ? 800 : 600 }}>{negative ? '−' : ''}{formatPaise(value)}</Typography>
  </Stack>
)

const ADDRESS_FIELDS = ['name', 'phone', 'address', 'city', 'state', 'pincode']

export const ReviseDialog = ({ order, open, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const [lines, setLines] = useState(() => toEditable(order.items.filter((i) => i.fulfilment_status !== 'cancelled')))
  const [delivery, setDelivery] = useState(order.delivery_paise)
  const [installation, setInstallation] = useState(order.installation_paise)
  const [address, setAddress] = useState(order.shipping_address || {})
  const [points, setPoints] = useState(order.points_redeemed || 0)
  const [reason, setReason] = useState('')
  const [key] = useState(submissionKey)
  const save = async () => {
    const changes = { items: toPayload(lines), delivery_paise: delivery ?? 0, installation_paise: installation ?? 0, shipping_address: address, points_redeemed: Number(points) || 0 }
    if (await run(PROPOSE_ORDER_REVISION, { orderId: order.id, changes, reason, idempotencyKey: key })) onSaved()
  }
  return (
    <SidebarPanel open={open} onClose={onClose} title={`Change ${order.order_number}`} onSave={save} saveLabel="Save change" loading={loading}>
      <Stack spacing={2}>
        <Alert severity="info">Changes to items, prices or charges are sent to the customer to confirm. Address-only changes apply at once. Dispatched units cannot be removed.</Alert>
        <LineEditor lines={lines} onChange={setLines} />
        <Grid container spacing={1.5}>
          <Grid item xs={6}><MoneyField label="Delivery charge" paise={delivery} onChange={setDelivery} /></Grid>
          <Grid item xs={6}><MoneyField label="Installation charge" paise={installation} onChange={setInstallation} /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth type="number" label="Reward points used" value={points} onChange={(e) => setPoints(e.target.value)} /></Grid>
        </Grid>
        <Typography variant="subtitle2">Delivery address</Typography>
        <Grid container spacing={1.5}>
          {ADDRESS_FIELDS.map((f) => (
            <Grid item xs={f === 'address' ? 12 : 6} key={f}><TextField size="small" fullWidth label={humanize(f)} value={address[f] || ''} onChange={(e) => setAddress({ ...address, [f]: e.target.value })} /></Grid>
          ))}
        </Grid>
        <TextField size="small" multiline minRows={2} required label="Reason (shown to the customer)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Stack>
    </SidebarPanel>
  )
}

const SummaryPanel = ({ order, canWrite, refetch }) => {
  const { run, loading } = useAction()
  const [revise, setRevise] = useState(false)
  const [reason, setReason] = useState('')
  const pending = order.pending_version
  const history = order.versions.filter((v) => v.status !== 'pending_customer')

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        {pending && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>Change v{pending.version_number} is waiting for the customer{pending.expires_at ? ` (until ${formatDate(pending.expires_at, 'short')})` : ''}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>{pending.reason}</Typography>
            <VersionDiff diff={pending.diff} />
            {canWrite && (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                <TextField size="small" label="Reason (required to withdraw or record a phone confirmation)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button size="small" variant="outlined" disabled={!reason.trim() || loading} onClick={async () => { if (await run(WITHDRAW_ORDER_REVISION, { versionId: pending.id, reason })) { setReason(''); refetch() } }}>Withdraw change</Button>
                  {order.allowed_actions.phone_confirmation && (
                    <Button size="small" variant="contained" disabled={!reason.trim() || loading} onClick={async () => { if (await run(RECORD_PHONE_CONFIRMATION, { versionId: pending.id, reason })) { setReason(''); refetch() } }}>Customer confirmed by phone</Button>
                  )}
                </Stack>
              </Stack>
            )}
          </Alert>
        )}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Items</Typography>
              {canWrite && order.allowed_actions.propose_revision && <Button size="small" variant="outlined" onClick={() => setRevise(true)}>Propose a change</Button>}
            </Stack>
            {order.items.map((i) => (
              <Stack key={i.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider', opacity: i.fulfilment_status === 'cancelled' ? 0.5 : 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{i.description}</Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {i.sku ? `SKU ${i.sku} · ` : ''}Qty {i.quantity} × {formatPaise(i.unit_price_paise)}{i.hsn_code ? ` · HSN ${i.hsn_code}` : ''} · GST {(i.tax_rate_bps || 0) / 100}%
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Chip size="small" label={i.fulfilment_type === 'made_to_order' ? 'Made to order' : 'From stock'} variant="outlined" />
                    <StatusChip status={i.fulfilment_status} />
                    {i.estimated_ready_max_date && <Chip size="small" variant="outlined" label={`Ready ${fmtDay(i.estimated_ready_min_date)} – ${fmtDay(i.revised_ready_date || i.estimated_ready_max_date)}`} />}
                    {i.units_in_shipments > 0 && <Chip size="small" variant="outlined" label={`${i.units_in_shipments}/${i.quantity} in shipments`} />}
                  </Stack>
                </Box>
                <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPaise(i.line_total_paise)}</Typography>
              </Stack>
            ))}
            <Box sx={{ mt: 1.5, ml: 'auto', maxWidth: 360 }}>
              <Row label="Subtotal" value={order.subtotal_paise} />
              {order.discount_paise > 0 && <Row label="Discount" value={order.discount_paise} negative />}
              {order.points_discount_paise > 0 && <Row label={`Reward points (${order.points_redeemed})`} value={order.points_discount_paise} negative />}
              {order.delivery_paise > 0 && <Row label="Delivery" value={order.delivery_paise} />}
              {order.installation_paise > 0 && <Row label="Installation" value={order.installation_paise} />}
              <Row label={`GST (${order.is_inter_state ? 'IGST' : 'CGST + SGST'})`} value={order.tax_paise} />
              <Divider sx={{ my: 0.5 }} />
              <Row label="Total" value={order.total_paise} strong />
            </Box>
          </CardContent>
        </Card>
        {history.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Versions</Typography>
              {history.map((v) => (
                <Box key={v.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 800 }}>v{v.version_number}</Typography>
                    <StatusChip status={v.status} />
                    <Typography variant="caption" color="text.secondary">{formatPaise(v.total_paise)} · {v.created_by_name || 'System'} · {formatDate(v.created_at, 'short')}{v.decision_channel ? ` · confirmed ${v.decision_channel}` : ''}</Typography>
                  </Stack>
                  {v.reason && <Typography variant="body2">{v.reason}</Typography>}
                  {v.version_number > 1 && <VersionDiff diff={v.diff} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Grid>
      <Grid item xs={12} lg={5}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Customer & delivery</Typography>
            <Stack spacing={1.25}>
              <KeyValue label="Customer">{order.customer?.name} · {order.customer?.phone}{order.customer?.status === 'invited' ? ' (not signed up yet)' : ''}</KeyValue>
              <KeyValue label="Ship to">{['name', 'phone', 'address', 'city', 'state', 'pincode'].map((k) => order.shipping_address?.[k]).filter(Boolean).join(', ')}</KeyValue>
              <KeyValue label="Delivery preference">{order.delivery_preference === 'ship_when_ready' ? 'Ship each item when ready' : 'Ship everything together'}</KeyValue>
              <KeyValue label="Estimated ready">{order.estimated_ready_max_date ? `${fmtDay(order.estimated_ready_min_date)} – ${fmtDay(order.estimated_ready_max_date)}` : '—'}</KeyValue>
              <KeyValue label="Source">{humanize(order.source)}</KeyValue>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>History</Typography>
            {order.events.map((e) => (
              <Box key={e.id} sx={{ borderLeft: 3, borderColor: e.is_customer_visible === false ? 'divider' : 'primary.main', pl: 1.5, mb: 1.25 }}>
                {e.to_status && <Typography variant="body2" sx={{ fontWeight: 700 }}>{humanize(e.to_status)}</Typography>}
                {e.note && <Typography variant="body2">{e.note}</Typography>}
                <Typography variant="caption" color="text.secondary">{e.actor_name || humanize(e.actor_type)} · {formatDate(e.created_at, 'long')}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      {revise && <ReviseDialog order={order} open={revise} onClose={() => setRevise(false)} onSaved={() => { setRevise(false); refetch() }} />}
    </Grid>
  )
}

export default SummaryPanel
