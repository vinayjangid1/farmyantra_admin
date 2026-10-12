/** Enquiry queue (§10.3, §14.3): call-backs and quotation requests with filters and status counts. */
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Chip, FormControlLabel, Switch, Tooltip, Typography } from '@mui/material'
import { PhoneCall, FileText, AlertCircle } from 'lucide-react'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, ExportButton, ErrorState } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar } from '@/shared/components/fy'
import { ENQUIRIES } from '@/services/admin.api'
import { usePermissions } from '@/features/permissions'
import { formatPaise } from '@/utils/money'
import { formatDate, formatRelativeTime } from '@/utils/dateFormatter'

const STATUS_GROUPS = [
  { key: 'open', label: 'Open', statuses: ['submitted', 'under_review', 'contacted', 'clarification_required', 'accepted'] },
  { key: 'submitted', label: 'New', statuses: ['submitted'] },
  { key: 'quoted', label: 'Quotation sent', statuses: ['quotation_sent'] },
  { key: 'won', label: 'Accepted / ordered', statuses: ['customer_accepted', 'converted_to_order'] },
  { key: 'lost', label: 'Declined / rejected', statuses: ['customer_declined', 'rejected', 'cancelled'] },
  { key: 'closed', label: 'Closed', statuses: ['closed'] },
  { key: 'all', label: 'All', statuses: [] },
]

const Enquiries = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { me } = usePermissions()
  const [group, setGroup] = useState(params.get('status') ? 'custom' : 'open')
  const [search, setSearch] = useState('')
  const [requestType, setRequestType] = useState(params.get('requestType') || 'all')
  const [assigned, setAssigned] = useState(params.get('assigned') || 'all')
  const [overdue, setOverdue] = useState(params.get('callbackOverdue') === '1')

  const filter = useMemo(() => {
    const statuses = group === 'custom' ? [params.get('status')] : STATUS_GROUPS.find((g) => g.key === group)?.statuses
    return {
      statuses: statuses?.length ? statuses : undefined,
      requestType: requestType === 'all' ? undefined : requestType,
      assignedTo: assigned === 'me' ? me?.id : undefined,
      unassigned: assigned === 'unassigned' || undefined,
      callbackOverdue: overdue || undefined,
      search: search.trim() || undefined,
    }
  }, [group, params, requestType, assigned, overdue, search, me?.id])

  const variables = useMemo(() => ({ filter, sortBy: overdue ? 'callback' : 'created', sortOrder: overdue ? 'ASC' : 'DESC' }), [filter, overdue])
  const list = usePagedQuery(ENQUIRIES, 'enquiries', variables)
  const counts = Object.fromEntries((list.meta?.status_counts || []).map((c) => [c.status, c.count]))
  const groupCount = (g) => (g.statuses.length ? g.statuses.reduce((s, st) => s + (counts[st] || 0), 0) : Object.values(counts).reduce((a, b) => a + b, 0))

  const columns = [
    {
      id: 'enquiry_number', label: 'Enquiry', minWidth: 150,
      format: (v, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography>
          <Typography variant="caption" color="text.secondary">{formatRelativeTime(row.created_at)}</Typography>
        </Box>
      ),
    },
    {
      id: 'request_type', label: 'Wants', minWidth: 120,
      format: (v) => <Chip size="small" icon={v === 'callback' ? <PhoneCall size={14} /> : <FileText size={14} />} label={v === 'callback' ? 'Call-back' : 'Quotation'} color={v === 'callback' ? 'warning' : 'info'} variant="outlined" />,
    },
    {
      id: 'contact_name', label: 'Customer', minWidth: 170,
      format: (v, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{v}</Typography>
          <Typography variant="caption" color="text.secondary">{row.contact_phone}{row.delivery_city ? ` · ${row.delivery_city}` : ''}</Typography>
        </Box>
      ),
    },
    { id: 'product_names', label: 'Products', minWidth: 220, format: (v, row) => <Tooltip title={v || ''}><span>{row.item_count} · {v?.length > 60 ? `${v.slice(0, 60)}…` : v}</span></Tooltip> },
    { id: 'total_paise', label: 'Indicative total', minWidth: 120, align: 'right', format: (v, row) => `${formatPaise(v)}${row.has_price_on_request ? ' +' : ''}` },
    {
      id: 'status', label: 'Status', minWidth: 150,
      format: (v, row) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <StatusChip status={v} />
          {row.unread_customer_messages > 0 && <Tooltip title="Unread customer messages"><AlertCircle size={16} color="#C98A0C" /></Tooltip>}
        </Box>
      ),
    },
    {
      id: 'callback_due_at', label: 'Call by', minWidth: 120,
      format: (v, row) => (row.request_type === 'callback' && v ? (
        <Typography variant="body2" color={new Date(v) < new Date() && ['submitted', 'under_review', 'clarification_required'].includes(row.status) ? 'error' : 'text.primary'}>
          {formatDate(v, 'short')}
        </Typography>
      ) : '—'),
    },
    { id: 'assigned_to_name', label: 'Assigned', minWidth: 120, format: (v) => v || <Typography variant="caption" color="text.disabled">Unassigned</Typography> },
  ]

  return (
    <PageContainer>
      <PageHeader title="Enquiries & call-backs" subtitle="Every customer request, newest first. Call-backs need a phone call; quotation requests need a written quote." count={list.total} />
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {STATUS_GROUPS.map((g) => (
          <Chip key={g.key} label={`${g.label} (${groupCount(g)})`} color={group === g.key ? 'primary' : 'default'} variant={group === g.key ? 'filled' : 'outlined'} onClick={() => { setGroup(g.key); list.resetPage() }} />
        ))}
      </Box>
      <Toolbar>
        <CustomTextField label="Search" placeholder="Number, name, phone, city…" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Request type" options={[{ value: 'callback', label: 'Call-back' }, { value: 'quotation', label: 'Quotation' }]} value={requestType} onChange={(v) => { setRequestType(v); list.resetPage() }} allLabel="All types" />
        <FilterDropdown label="Assigned" options={[{ value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' }]} value={assigned} onChange={(v) => { setAssigned(v); list.resetPage() }} allLabel="Anyone" />
        <FormControlLabel control={<Switch checked={overdue} onChange={(e) => { setOverdue(e.target.checked); list.resetPage() }} />} label="Overdue call-backs" />
        <Box sx={{ flex: 1 }} />
        <ExportButton
          rows={list.rows}
          filenamePrefix="enquiries"
          columns={[
            { key: 'enquiry_number', label: 'Enquiry' }, { key: 'request_type', label: 'Type' }, { key: 'status', label: 'Status' },
            { key: 'contact_name', label: 'Name' }, { key: 'contact_phone', label: 'Phone' }, { key: 'delivery_city', label: 'City' },
            { key: 'product_names', label: 'Products' }, { key: 'total_paise', label: 'Total (paise)' }, { key: 'created_at', label: 'Created' },
          ]}
        />
      </Toolbar>
      {list.error ? (
        <ErrorState message={list.error.message} />
      ) : (
        <CustomTable
          tableId="enquiries"
          columns={columns}
          rows={list.rows}
          page={list.page}
          rowsPerPage={list.rowsPerPage}
          totalRows={list.total}
          onPageChange={list.onPageChange}
          onRowsPerPageChange={list.onRowsPerPageChange}
          onRowClick={(row) => navigate(`/enquiries/${row.id}`)}
        />
      )}
      {list.loading && !list.rows.length && <Typography variant="body2" color="text.secondary">Loading…</Typography>}
      {!list.loading && !list.rows.length && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No enquiries match these filters.</Typography>}
    </PageContainer>
  )
}

export default Enquiries
