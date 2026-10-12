/**
 * Order (§25–§30): accept, change with versions, production, shipments,
 * delivery confirmation, documents, tax invoices, payments and points.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Box, Button, Card, Link, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { ArrowLeft } from 'lucide-react'

import { ConfirmDialog, LoadingState, ErrorState, PageContainer } from '@/shared/components'
import { StatusChip } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { ORDER, ACCEPT_ORDER, CANCEL_ORDER, COMPLETE_ORDER } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'

import SummaryPanel from './order/SummaryPanel'
import ProductionPanel from './order/ProductionPanel'
import ShipmentsPanel from './order/ShipmentsPanel'
import DeliveryPanel from './order/DeliveryPanel'
import MoneyPanel from './order/MoneyPanel'

const OrderDetail = () => {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'summary'
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:orders:write')
  const { data, loading, error, refetch } = useQuery(ORDER, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const { run, loading: busy } = useAction()
  const [confirm, setConfirm] = useState(null)
  const [reason, setReason] = useState('')

  const order = data?.order
  if (loading && !order) return <LoadingState message="Loading order…" />
  if (error) return <ErrorState title="Could not load order" message={error.message} />
  if (!order) return null

  const a = order.allowed_actions
  const openIssues = order.issues.filter((i) => ['open', 'in_progress', 'awaiting_customer'].includes(i.status)).length
  const tabs = [
    { key: 'summary', label: 'Items & changes', show: true },
    { key: 'production', label: `Production${order.jobs.length ? ` (${order.jobs.length})` : ''}`, show: hasPermission('admin:manufacturing:read') },
    { key: 'shipments', label: `Shipments${order.shipments.length ? ` (${order.shipments.length})` : ''}`, show: hasPermission('admin:shipments:read') },
    { key: 'delivery', label: 'Delivery & issues', show: true, badge: openIssues },
    { key: 'money', label: 'Invoices, payments & documents', show: true },
  ].filter((t) => t.show)
  const panelProps = { order, canWrite, refetch }
  const doAction = async () => {
    const ok = confirm === 'accept' ? await run(ACCEPT_ORDER, { id })
      : confirm === 'cancel' ? await run(CANCEL_ORDER, { id, reason })
        : await run(COMPLETE_ORDER, { id })
    if (ok) { setConfirm(null); setReason(''); refetch() }
  }

  return (
    <PageContainer>
      <Button component={RouterLink} to="/orders" startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Orders</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{order.order_number}</Typography>
            <StatusChip status={order.status} />
            {order.has_pending_revision && <StatusChip status="pending" label="Change awaiting customer" />}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {order.customer?.name} · {formatPaise(order.total_paise)} · payment {order.payment_summary.status.replace(/_/g, ' ')}
            {order.enquiry_id && <> · <Link component={RouterLink} to={`/enquiries/${order.enquiry_id}`}>Enquiry</Link></>}
            {order.quotation_id && <> · <Link component={RouterLink} to={`/quotations/${order.quotation_id}`}>Quotation</Link></>}
          </Typography>
        </Box>
        {canWrite && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {a.accept && <Button variant="contained" onClick={() => setConfirm('accept')}>Accept order</Button>}
            {a.complete && <Button variant="contained" color="success" onClick={() => setConfirm('complete')}>Mark completed</Button>}
            {a.cancel && <Button color="error" onClick={() => setConfirm('cancel')}>Cancel order</Button>}
          </Stack>
        )}
      </Stack>
      {order.status === 'pending_confirmation' && <Alert severity="warning" sx={{ mb: 2 }}>Check stock, prices and delivery, then accept. Accepting creates production jobs for made-to-order items and reserves any reward points.</Alert>}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setParams({ tab: v }, { replace: true })} variant="scrollable" scrollButtons="auto" sx={{ px: 1 }}>
          {tabs.map((t) => <Tab key={t.key} value={t.key} label={t.badge ? <Badge color="error" badgeContent={t.badge}><Box sx={{ pr: 1.5 }}>{t.label}</Box></Badge> : t.label} />)}
        </Tabs>
      </Card>
      {tab === 'summary' && <SummaryPanel {...panelProps} />}
      {tab === 'production' && <ProductionPanel {...panelProps} canWrite={hasPermission('admin:manufacturing:write')} />}
      {tab === 'shipments' && <ShipmentsPanel {...panelProps} canWrite={hasPermission('admin:shipments:write')} />}
      {tab === 'delivery' && <DeliveryPanel {...panelProps} />}
      {tab === 'money' && <MoneyPanel {...panelProps} />}

      <ConfirmDialog
        open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={doAction} loading={busy}
        severity={confirm === 'cancel' ? 'error' : 'info'}
        title={{ accept: 'Accept this order?', cancel: 'Cancel this order?', complete: 'Mark as completed?' }[confirm] || ''}
        confirmLabel={{ accept: 'Accept', cancel: 'Cancel order', complete: 'Complete' }[confirm] || 'OK'}
        message={confirm === 'cancel'
          ? <TextField fullWidth size="small" multiline minRows={2} required label="Reason (the customer sees it)" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1 }} />
          : confirm === 'accept' ? 'The customer is notified and production starts.' : 'Completed orders are closed for changes.'}
      />
    </PageContainer>
  )
}

export default OrderDetail
