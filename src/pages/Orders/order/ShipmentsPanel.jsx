/** Shipments for one order: create, update, reassign, cancel (§27). */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { Truck } from 'lucide-react'

import { SidebarPanel } from '@/shared/components'
import { StatusChip, MoneyField, KeyValue } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { CREATE_SHIPMENT, CHANGE_SHIPMENT_ASSIGNMENT, CANCEL_SHIPMENT, MARK_SHIPMENT_DELIVERED, DRIVERS } from '@/services/admin.api'
import { MediaThumbs, ShipmentEventDialog } from '@/features/fulfilment'
import { fmtDay } from '@/features/fulfilment/utils'
import { formatDate } from '@/utils/dateFormatter'

const DriverSelect = ({ value, onChange, label = 'Driver' }) => {
  const { data } = useQuery(DRIVERS, { variables: { status: 'active' }, fetchPolicy: 'cache-and-network' })
  return (
    <TextField select size="small" fullWidth label={label} value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <MenuItem value="">Not assigned yet</MenuItem>
      {(data?.drivers || []).map((d) => <MenuItem key={d.id} value={d.id}>{d.name} · {d.vehicle_registration || 'no vehicle'}</MenuItem>)}
    </TextField>
  )
}

export const CreateShipmentDialog = ({ order, open, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const shippable = order.items.filter((i) => i.units_unallocated > 0 && i.fulfilment_status !== 'cancelled')
  const [qty, setQty] = useState(() => Object.fromEntries(shippable.map((i) => [i.id, ['ready', 'in_shipment'].includes(i.fulfilment_status) || i.fulfilment_type === 'in_stock' ? i.units_unallocated : 0])))
  const [form, setForm] = useState({ driver_id: null, vehicle_registration: '', vehicle_type: '', planned_pickup_date: '', planned_delivery_date: '', freight_cost_paise: null, lr_number: '', eway_bill_number: '', handling_notes: '' })
  const save = async () => {
    const items = Object.entries(qty).filter(([, q]) => Number(q) > 0).map(([order_item_id, quantity]) => ({ order_item_id, quantity: Number(quantity) }))
    const input = { ...form, items, planned_pickup_date: form.planned_pickup_date || null, planned_delivery_date: form.planned_delivery_date || null }
    if (await run(CREATE_SHIPMENT, { orderId: order.id, input })) onSaved()
  }
  return (
    <SidebarPanel open={open} onClose={onClose} title="New shipment" onSave={save} saveLabel="Create shipment" loading={loading}>
      <Stack spacing={2}>
        {!shippable.length && <Alert severity="info">Every unit is already in a shipment.</Alert>}
        {shippable.map((i) => (
          <Stack key={i.id} direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{i.description}</Typography>
              <Typography variant="caption" color="text.secondary">{i.units_unallocated} of {i.quantity} unit(s) left · {i.fulfilment_status.replace(/_/g, ' ')}</Typography>
            </Box>
            <TextField size="small" type="number" label="Units" sx={{ width: 96 }} inputProps={{ min: 0, max: i.units_unallocated }} value={qty[i.id] ?? 0} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} />
          </Stack>
        ))}
        <DriverSelect value={form.driver_id} onChange={(v) => setForm({ ...form, driver_id: v })} />
        <Grid container spacing={1.5}>
          <Grid item xs={6}><TextField size="small" fullWidth label="Vehicle number" placeholder="MP09 AB 1234" value={form.vehicle_registration} onChange={(e) => setForm({ ...form, vehicle_registration: e.target.value })} helperText="Defaults to the driver's vehicle" /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth label="Vehicle type" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth type="date" label="Planned pickup" InputLabelProps={{ shrink: true }} value={form.planned_pickup_date} onChange={(e) => setForm({ ...form, planned_pickup_date: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth type="date" label="Planned delivery" InputLabelProps={{ shrink: true }} value={form.planned_delivery_date} onChange={(e) => setForm({ ...form, planned_delivery_date: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth label="LR number" value={form.lr_number} onChange={(e) => setForm({ ...form, lr_number: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField size="small" fullWidth label="E-way bill number" value={form.eway_bill_number} onChange={(e) => setForm({ ...form, eway_bill_number: e.target.value })} /></Grid>
          <Grid item xs={6}><MoneyField label="Freight cost (internal)" paise={form.freight_cost_paise} onChange={(v) => setForm({ ...form, freight_cost_paise: v })} /></Grid>
        </Grid>
        <TextField size="small" multiline minRows={2} label="Handling notes (internal)" value={form.handling_notes} onChange={(e) => setForm({ ...form, handling_notes: e.target.value })} />
      </Stack>
    </SidebarPanel>
  )
}

export const ShipmentCard = ({ shipment, canWrite, onChanged }) => {
  const { run, loading } = useAction()
  const [eventOpen, setEventOpen] = useState(false)
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({})
  const closed = ['delivered', 'cancelled'].includes(shipment.status)
  const save = async () => {
    let ok
    if (mode === 'assign') ok = await run(CHANGE_SHIPMENT_ASSIGNMENT, { shipmentId: shipment.id, driverId: form.driver_id || null, vehicleRegistration: form.vehicle_registration || null, vehicleType: form.vehicle_type || null, reason: form.reason, customerVisible: form.customer_visible !== false })
    if (mode === 'cancel') ok = await run(CANCEL_SHIPMENT, { id: shipment.id, reason: form.reason })
    if (mode === 'delivered') ok = await run(MARK_SHIPMENT_DELIVERED, { id: shipment.id, reason: form.reason })
    if (ok) { setMode(null); setForm({}); onChanged() }
  }
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
          <Truck size={18} />
          <Typography sx={{ fontWeight: 800 }}>{shipment.shipment_number}</Typography>
          <StatusChip status={shipment.status} />
          {shipment.is_delayed && <StatusChip status="failed" label="Delayed" />}
        </Stack>
        <Grid container spacing={1.5} sx={{ mb: 1 }}>
          <Grid item xs={6}><KeyValue label="Driver">{shipment.driver_name ? `${shipment.driver_name} · ${shipment.driver_mobile}` : '—'}</KeyValue></Grid>
          <Grid item xs={6}><KeyValue label="Vehicle">{[shipment.vehicle_registration, shipment.vehicle_type].filter(Boolean).join(' · ') || '—'}</KeyValue></Grid>
          <Grid item xs={6}><KeyValue label="Planned delivery">{fmtDay(shipment.revised_delivery_date || shipment.planned_delivery_date)}</KeyValue></Grid>
          <Grid item xs={6}><KeyValue label="Items">{shipment.items.map((i) => `${i.description} × ${i.quantity}`).join(', ')}</KeyValue></Grid>
        </Grid>
        {shipment.events.map((e) => (
          <Box key={e.id} sx={{ borderLeft: 3, borderColor: e.customer_visible ? 'primary.main' : 'divider', pl: 1.25, mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{e.label}{e.location_text ? ` · ${e.location_text}` : ''}</Typography>
            {e.note && <Typography variant="body2">{e.note}</Typography>}
            <MediaThumbs media={e.media} size={48} />
            <Typography variant="caption" color="text.secondary">{formatDate(e.occurred_at, 'long')}{e.actor_name ? ` · ${e.actor_name}` : ''}</Typography>
          </Box>
        ))}
        {canWrite && !closed && (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
            <Button size="small" variant="contained" onClick={() => setEventOpen(true)}>Add update</Button>
            <Button size="small" variant="outlined" onClick={() => { setForm({ driver_id: shipment.driver_id, vehicle_registration: shipment.vehicle_registration, vehicle_type: shipment.vehicle_type }); setMode('assign') }}>Change driver / vehicle</Button>
            {shipment.status === 'reached_destination' && <Button size="small" onClick={() => setMode('delivered')}>Mark delivered</Button>}
            {['planned', 'preparing'].includes(shipment.status) && <Button size="small" color="error" onClick={() => setMode('cancel')}>Cancel</Button>}
          </Stack>
        )}
      </CardContent>
      <ShipmentEventDialog shipment={eventOpen ? shipment : null} onClose={() => setEventOpen(false)} onSaved={() => { setEventOpen(false); onChanged() }} />
      <SidebarPanel open={Boolean(mode)} onClose={() => setMode(null)} title={{ assign: 'Change driver or vehicle', cancel: 'Cancel shipment', delivered: 'Mark as delivered' }[mode] || ''} onSave={save} loading={loading}>
        <Stack spacing={2}>
          {mode === 'assign' && (
            <>
              <DriverSelect value={form.driver_id} onChange={(v) => setForm({ ...form, driver_id: v })} />
              <TextField size="small" label="Vehicle number" value={form.vehicle_registration || ''} onChange={(e) => setForm({ ...form, vehicle_registration: e.target.value })} />
              <TextField size="small" label="Vehicle type" value={form.vehicle_type || ''} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} />
              <FormControlLabel control={<Switch checked={form.customer_visible !== false} onChange={(e) => setForm({ ...form, customer_visible: e.target.checked })} />} label="Tell the customer" />
            </>
          )}
          {mode === 'delivered' && <Alert severity="warning">Only when the customer has not answered for the configured number of days. Record how delivery was verified (call, signed LR…).</Alert>}
          <TextField size="small" multiline minRows={2} required label="Reason" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Stack>
      </SidebarPanel>
    </Card>
  )
}

const ShipmentsPanel = ({ order, canWrite, refetch }) => {
  const [open, setOpen] = useState(false)
  return (
    <Box>
      {canWrite && order.allowed_actions.create_shipment && (
        <Button variant="contained" startIcon={<Truck size={16} />} sx={{ mb: 2 }} onClick={() => setOpen(true)}>New shipment</Button>
      )}
      {!order.shipments.length && <Alert severity="info">No shipments yet. Items can ship together or separately when ready.</Alert>}
      <Grid container spacing={2}>
        {order.shipments.map((s) => <Grid item xs={12} md={6} key={s.id}><ShipmentCard shipment={s} canWrite={canWrite} onChanged={refetch} /></Grid>)}
      </Grid>
      {open && <CreateShipmentDialog order={order} open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); refetch() }} />}
    </Box>
  )
}

export default ShipmentsPanel
