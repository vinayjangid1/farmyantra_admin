/**
 * Today (§31.6): the phone-first start page for the workshop, dispatch and
 * sales — what needs doing now, in big tappable cards.
 */
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material'
import { AlertTriangle, ClipboardCheck, Factory, PackageCheck, Truck } from 'lucide-react'

import { LoadingState, PageContainer, PageHeader } from '@/shared/components'
import { StatusChip } from '@/shared/components/fy'
import { TODAY_BOARD } from '@/services/admin.api'
import { en, fmtDay } from '@/features/fulfilment/utils'

const Tile = ({ icon: Icon, label, count, color = 'primary', onClick }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ color: `${color}.main`, display: 'flex' }}><Icon size={28} /></Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>{count ?? 0}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
)

const Row = ({ title, subtitle, status, onClick }) => (
  <Card variant="outlined" sx={{ mb: 1 }}>
    <CardActionArea onClick={onClick}>
      <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>{title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">{subtitle}</Typography>
          </Box>
          {status}
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
)

const Today = () => {
  const navigate = useNavigate()
  const { data, loading } = useQuery(TODAY_BOARD, { fetchPolicy: 'cache-and-network', pollInterval: 60_000 })
  const b = data?.todayBoard
  if (loading && !b) return <LoadingState message="Loading today…" />
  if (!b) return null
  const c = b.counts || {}
  return (
    <PageContainer>
      <PageHeader title="Today" subtitle="What needs attention right now." />
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {'orders_to_accept' in c && <Grid item xs={6} md={3}><Tile icon={ClipboardCheck} label="Orders to accept" count={c.orders_to_accept} color="warning" onClick={() => navigate('/orders?status=pending_confirmation')} /></Grid>}
        {'production_delayed' in c && <Grid item xs={6} md={3}><Tile icon={Factory} label="Delayed in production" count={c.production_delayed} color="error" onClick={() => navigate('/production')} /></Grid>}
        {'shipments_active' in c && <Grid item xs={6} md={3}><Tile icon={Truck} label="Shipments moving" count={c.shipments_active} onClick={() => navigate('/shipments')} /></Grid>}
        {'awaiting_confirmation' in c && <Grid item xs={6} md={3}><Tile icon={PackageCheck} label="Awaiting customer" count={c.awaiting_confirmation} color="info" onClick={() => navigate('/deliveries')} /></Grid>}
        {'open_issues' in c && <Grid item xs={6} md={3}><Tile icon={AlertTriangle} label="Open delivery issues" count={c.open_issues} color="error" onClick={() => navigate('/deliveries')} /></Grid>}
      </Grid>
      <Grid container spacing={2}>
        {b.orders_to_accept?.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Orders to accept</Typography>
            {b.orders_to_accept.map((o) => <Row key={o.id} title={`${o.order_number} · ${o.customer_name}`} subtitle={o.item_summary} status={<StatusChip status={o.status} />} onClick={() => navigate(`/orders/${o.id}`)} />)}
          </Grid>
        )}
        {b.production && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Production</Typography>
            {[...b.production.delayed, ...b.production.active.filter((j) => !j.is_delayed)].slice(0, 12).map((j) => (
              <Row key={j.id} title={`${j.description} × ${j.quantity}`} subtitle={`${j.order_number} · ${j.current_stage ? en(j.current_stage.name_i18n) : 'Not started'} · ready by ${fmtDay(j.revised_ready_date || j.estimated_ready_max_date)}`}
                status={j.is_delayed ? <StatusChip status="failed" label="Delayed" /> : <StatusChip status={j.status} />} onClick={() => navigate(`/orders/${j.order_id}?tab=production`)} />
            ))}
          </Grid>
        )}
        {b.shipments && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Shipments</Typography>
            {b.shipments.slice(0, 12).map((s) => (
              <Row key={s.id} title={`${s.shipment_number} · ${s.customer_name}`} subtitle={`${s.order_number} · ${s.vehicle_registration || 'no vehicle'} · ${fmtDay(s.revised_delivery_date || s.planned_delivery_date)}`} status={<StatusChip status={s.status} />} onClick={() => navigate(`/orders/${s.order_id}?tab=shipments`)} />
            ))}
          </Grid>
        )}
        {b.issues?.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Delivery issues</Typography>
            {b.issues.map((i) => <Row key={i.id} title={`${i.issue_number} · ${i.customer_name}`} subtitle={i.description} status={<StatusChip status={i.status} />} onClick={() => navigate(`/orders/${i.order_id}?tab=delivery`)} />)}
          </Grid>
        )}
      </Grid>
    </PageContainer>
  )
}

export default Today
