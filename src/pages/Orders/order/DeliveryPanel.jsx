/** Delivery confirmations, issues and reward points for one order (§28, §30). */
import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material'

import { StatusChip, humanize } from '@/shared/components/fy'
import { usePermissions } from '@/features/permissions'
import { MediaThumbs } from '@/features/fulfilment'
import IssueThread from '@/features/fulfilment/IssueThread'
import { formatDate } from '@/utils/dateFormatter'

const DeliveryPanel = ({ order, refetch }) => {
  const { hasPermission } = usePermissions()
  const shipmentNo = (id) => order.shipments.find((s) => s.id === id)?.shipment_number || 'Shipment'
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Customer confirmations</Typography>
            {!order.confirmations.length && <Typography variant="body2" color="text.secondary">The customer is asked to confirm when a shipment reaches its destination.</Typography>}
            {order.confirmations.map((c) => (
              <Stack key={c.id} spacing={0.5} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{shipmentNo(c.shipment_id)}</Typography>
                  <StatusChip status={c.status} />
                </Stack>
                {c.customer_note && <Typography variant="body2">“{c.customer_note}”</Typography>}
                <MediaThumbs media={c.media} />
                <Typography variant="caption" color="text.secondary">
                  Asked {formatDate(c.requested_at, 'short')}{c.answered_at ? ` · answered ${formatDate(c.answered_at, 'short')}` : ''}{c.photo_consent ? ' · photo may be shown on the website' : ''}{c.admin_reason ? ` · ${c.admin_reason}` : ''}
                </Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Reward points</Typography>
            {order.points_redeemed > 0
              ? <Typography variant="body2">{order.points_redeemed} points used ({humanize(order.points_reservation?.status || 'pending')}) — discount on this order.</Typography>
              : <Typography variant="body2" color="text.secondary">No points used on this order.</Typography>}
            <Typography variant="caption" color="text.secondary">Points are earned when the order is delivered and become usable after the holding period.</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Delivery issues</Typography>
            {!order.issues.length && <Alert severity="success">No issues reported.</Alert>}
            {order.issues.map((issue) => (
              <Stack key={issue.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <IssueThread issue={issue} canWrite={hasPermission('admin:delivery_issues:write')} onChanged={refetch} />
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DeliveryPanel
