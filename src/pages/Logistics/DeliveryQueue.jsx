/** Deliveries waiting for the customer's answer, and open delivery issues (§28.1–§28.2). */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Link, Tab, Tabs, TextField, Typography } from '@mui/material'

import { CustomTable, FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, humanize, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { PENDING_DELIVERY_CONFIRMATIONS, MARK_SHIPMENT_DELIVERED, DELIVERY_ISSUES, DELIVERY_ISSUE } from '@/services/admin.api'
import IssueThread from '@/features/fulfilment/IssueThread'
import { ISSUE_STATUSES } from '@/features/fulfilment/utils'
import { formatDate } from '@/utils/dateFormatter'

const Waiting = ({ canWrite }) => {
  const { data, refetch } = useQuery(PENDING_DELIVERY_CONFIRMATIONS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [mark, setMark] = useState(null)
  const [reason, setReason] = useState('')
  const rows = data?.pendingDeliveryConfirmations || []
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>Customers get a reminder automatically. Mark a shipment delivered yourself only after the waiting period, with how you verified it.</Alert>
      <CustomTable tableId="delivery-waiting" rows={rows} columns={[
        { id: 'shipment_number', label: 'Shipment', format: (v, r) => <Link component={RouterLink} to={`/orders/${r.order_id}?tab=delivery`}>{v} · {r.order_number}</Link> },
        { id: 'customer_name', label: 'Customer', format: (v, r) => <>{v}<br /><Typography variant="caption"><a href={`tel:${r.customer_phone}`}>{r.customer_phone}</a></Typography></> },
        { id: 'status', label: 'Answer', format: (v) => <StatusChip status={v} /> },
        { id: 'age_days', label: 'Waiting', format: (v) => `${v} day${v === 1 ? '' : 's'}` },
        { id: 'id', label: '', format: (_v, r) => (canWrite && r.can_mark_delivered ? <Button size="small" onClick={() => setMark(r)}>Mark delivered</Button> : null) },
      ]} />
      <SidebarPanel open={Boolean(mark)} onClose={() => setMark(null)} title={mark ? `Mark ${mark.shipment_number} delivered` : ''} loading={loading}
        onSave={async () => { if (await run(MARK_SHIPMENT_DELIVERED, { id: mark.shipment_id, reason })) { setMark(null); setReason(''); refetch() } }}>
        <TextField fullWidth size="small" multiline minRows={3} required label="How was delivery verified?" placeholder="Called the customer on 12 Oct, confirmed received; signed LR on file" value={reason} onChange={(e) => setReason(e.target.value)} />
      </SidebarPanel>
    </>
  )
}

const Issues = ({ canWrite }) => {
  const [status, setStatus] = useState('all')
  const { data, refetch } = useQuery(DELIVERY_ISSUES, { variables: { status: status === 'all' ? undefined : status }, fetchPolicy: 'cache-and-network' })
  const [open, setOpen] = useState(null)
  const { data: detail, refetch: refetchDetail } = useQuery(DELIVERY_ISSUE, { variables: { id: open }, skip: !open, fetchPolicy: 'network-only' })
  return (
    <>
      <Toolbar><FilterDropdown label="Status" value={status} onChange={setStatus} allLabel="Open" options={ISSUE_STATUSES.map((s) => ({ value: s, label: humanize(s) }))} /></Toolbar>
      <CustomTable tableId="delivery-issues" rows={data?.deliveryIssues || []} onRowClick={(r) => setOpen(r.id)} columns={[
        { id: 'issue_number', label: 'Case', format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 700 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.order_number}</Typography></> },
        { id: 'customer_name', label: 'Customer' },
        { id: 'issue_type', label: 'Type', format: (v) => humanize(v) },
        { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
        { id: 'created_at', label: 'Opened', format: (v) => formatDate(v, 'short') },
      ]} />
      <SidebarPanel open={Boolean(open)} onClose={() => setOpen(null)} title={detail?.deliveryIssue ? `${detail.deliveryIssue.issue_number} · ${detail.deliveryIssue.customer_name}` : 'Issue'}>
        {detail?.deliveryIssue && (
          <Box>
            <Link component={RouterLink} to={`/orders/${detail.deliveryIssue.order_id}?tab=delivery`} sx={{ display: 'block', mb: 1 }}>Open order</Link>
            <IssueThread issue={detail.deliveryIssue} canWrite={canWrite} onChanged={() => { refetchDetail(); refetch() }} />
          </Box>
        )}
      </SidebarPanel>
    </>
  )
}

const DeliveryQueue = () => {
  const { hasPermission } = usePermissions()
  const [tab, setTab] = useState(hasPermission('admin:shipments:read') ? 'waiting' : 'issues')
  return (
    <PageContainer>
      <PageHeader title="Delivery confirmations & issues" subtitle="Customers confirm receipt in their account; problems open a case here." />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        {hasPermission('admin:shipments:read') && <Tab value="waiting" label="Waiting for customer" />}
        {hasPermission('admin:delivery_issues:read') && <Tab value="issues" label="Issues" />}
      </Tabs>
      {tab === 'waiting' && <Waiting canWrite={hasPermission('admin:shipments:write')} />}
      {tab === 'issues' && <Issues canWrite={hasPermission('admin:delivery_issues:write')} />}
    </PageContainer>
  )
}

export default DeliveryQueue
