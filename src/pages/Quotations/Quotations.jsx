import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar } from '@/shared/components/fy'
import { QUOTATIONS } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const STATUS = ['draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))

const Quotations = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [search, setSearch] = useState('')
  const expiring = params.get('expiring') === '1'
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, search: search || undefined, expiringWithinDays: expiring ? 3 : undefined }), [status, search, expiring])
  const list = usePagedQuery(QUOTATIONS, 'quotations', variables)

  const columns = [
    { id: 'quotation_number', label: 'Quotation', minWidth: 140, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography><Typography variant="caption" color="text.secondary">v{r.version_number} · {r.enquiry_number}</Typography></> },
    { id: 'contact_name', label: 'Customer', minWidth: 160, format: (v, r) => <>{v}<br /><Typography variant="caption" color="text.secondary">{r.contact_phone}</Typography></> },
    { id: 'total_paise', label: 'Total', align: 'right', minWidth: 120, format: (v) => formatPaise(v) },
    { id: 'status', label: 'Status', minWidth: 110, format: (v) => <StatusChip status={v} /> },
    { id: 'valid_until', label: 'Valid until', minWidth: 110, format: (v) => (v ? formatDate(v, 'short') : '—') },
    { id: 'sent_at', label: 'Sent', minWidth: 110, format: (v) => (v ? formatDate(v, 'short') : '—') },
  ]

  return (
    <PageContainer>
      <PageHeader title="Quotations" subtitle="Drafts, sent quotations and customer decisions. Sent versions are never edited — revise instead." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Quotation, enquiry, customer…" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Status" options={STATUS} value={status} onChange={(v) => { setStatus(v); list.resetPage() }} allLabel="All statuses" />
        {expiring && <Typography variant="body2" color="warning.main">Showing quotations expiring within 3 days</Typography>}
      </Toolbar>
      <CustomTable tableId="quotations" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={(r) => navigate(`/quotations/${r.id}`)} />
    </PageContainer>
  )
}

export default Quotations
