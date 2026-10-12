import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { ORDERS } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const STATUSES = ['pending_confirmation', 'confirmed', 'in_production', 'ready_to_dispatch', 'dispatched', 'delivered', 'completed', 'cancelled']

const Orders = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [search, setSearch] = useState('')
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, search: search || undefined }), [status, search])
  const list = usePagedQuery(ORDERS, 'orders', variables)
  const columns = [
    { id: 'order_number', label: 'Order', minWidth: 140, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.enquiry_number}</Typography></> },
    { id: 'customer_name', label: 'Customer', minWidth: 160, format: (v, r) => <>{v}<br /><Typography variant="caption" color="text.secondary">{r.customer_phone}</Typography></> },
    { id: 'item_summary', label: 'Items', minWidth: 220 },
    { id: 'total_paise', label: 'Total', align: 'right', format: (v) => formatPaise(v) },
    { id: 'payment_status', label: 'Payment', format: (v) => humanize(v) },
    { id: 'status', label: 'Status', minWidth: 150, format: (v) => <StatusChip status={v} /> },
    { id: 'created_at', label: 'Created', format: (v) => formatDate(v, 'short') },
  ]
  return (
    <PageContainer>
      <PageHeader title="Orders" subtitle="Created from accepted quotations. Payments are recorded manually — nothing is charged online." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Order, customer, enquiry…" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Status" options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))} value={status} onChange={(v) => { setStatus(v); list.resetPage() }} allLabel="All statuses" />
      </Toolbar>
      <CustomTable tableId="orders" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={(r) => navigate(`/orders/${r.id}`)} />
    </PageContainer>
  )
}

export default Orders
