/** Shipments board (§27): what is moving, what is delayed, and quick updates from a phone. */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, FormControlLabel, Grid, Link, Stack, Switch, Typography } from '@mui/material'

import { CustomTextField, EmptyState, FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { usePermissions } from '@/features/permissions'
import { SHIPMENTS, SHIPMENT } from '@/services/admin.api'
import { fmtDay } from '@/features/fulfilment/utils'
import { ShipmentCard } from '@/pages/Orders/order/ShipmentsPanel'

const STATUSES = ['planned', 'preparing', 'picked_up', 'in_transit', 'reached_destination', 'delivered', 'cancelled']

const ShipmentDrawer = ({ id, onClose, canWrite, onChanged }) => {
  const { data, refetch } = useQuery(SHIPMENT, { variables: { id }, skip: !id, fetchPolicy: 'network-only' })
  const s = data?.shipment
  return (
    <SidebarPanel open={Boolean(id)} onClose={onClose} title={s ? `${s.shipment_number} · ${s.order?.order_number} · ${s.order?.customer_name}` : 'Shipment'}>
      {s && (
        <Box>
          <Link component={RouterLink} to={`/orders/${s.order?.id}?tab=shipments`} sx={{ display: 'block', mb: 1 }}>Open order</Link>
          <ShipmentCard shipment={s} canWrite={canWrite} onChanged={() => { refetch(); onChanged() }} />
        </Box>
      )}
    </SidebarPanel>
  )
}

const Shipments = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:shipments:write')
  const [status, setStatus] = useState('all')
  const [delayed, setDelayed] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, delayed: delayed || undefined, search: search || undefined }), [status, delayed, search])
  const list = usePagedQuery(SHIPMENTS, 'shipments', variables, { rowsPerPage: 60 })
  return (
    <PageContainer>
      <PageHeader title="Shipments" subtitle="Each update can notify the customer. “Reached destination” asks them to confirm delivery." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Shipment, order, customer, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Status" value={status} onChange={setStatus} allLabel="Active" options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
        <FormControlLabel control={<Switch checked={delayed} onChange={(e) => setDelayed(e.target.checked)} />} label="Delayed only" />
      </Toolbar>
      {!list.loading && !list.rows.length && <EmptyState title="No shipments" message="Create shipments from an order's Shipments tab." />}
      <Grid container spacing={1.5}>
        {list.rows.map((s) => (
          <Grid item xs={12} sm={6} lg={4} key={s.id}>
            <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: s.is_delayed ? 'error.main' : 'primary.main' }}>
              <CardActionArea onClick={() => setOpen(s.id)}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 800, flex: 1 }}>{s.shipment_number}</Typography>
                    <StatusChip status={s.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{s.order_number} · {s.customer_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[s.driver_name, s.vehicle_registration].filter(Boolean).join(' · ') || 'No driver yet'} · delivery {fmtDay(s.revised_delivery_date || s.planned_delivery_date)}{s.is_delayed ? ' · delayed' : ''}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ShipmentDrawer id={open} onClose={() => setOpen(null)} canWrite={canWrite} onChanged={list.refetch} />
    </PageContainer>
  )
}

export default Shipments
