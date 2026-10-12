import { useMemo, useState } from 'react'
import { MenuItem, TextField, Typography, Link } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader } from '@/shared/components'
import { usePagedQuery, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { CONTACT_MESSAGES, SET_CONTACT_STATUS } from '@/services/admin.api'
import { formatDate } from '@/utils/dateFormatter'

const STATUS = [{ value: 'new', label: 'New' }, { value: 'in_progress', label: 'In progress' }, { value: 'closed', label: 'Closed' }]

const ContactMessages = () => {
  const [status, setStatus] = useState('new')
  const [search, setSearch] = useState('')
  const { hasPermission } = usePermissions()
  const { run } = useAction()
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, search: search || undefined }), [status, search])
  const list = usePagedQuery(CONTACT_MESSAGES, 'contactMessages', variables)
  const columns = [
    { id: 'created_at', label: 'Received', minWidth: 110, format: (v) => formatDate(v, 'short') },
    { id: 'name', label: 'From', minWidth: 160, format: (v, r) => <>{v}<br /><Typography variant="caption">{r.phone && <Link href={`tel:${r.phone}`}>{r.phone}</Link>} {r.email}</Typography></> },
    { id: 'message', label: 'Message', minWidth: 320, format: (v, r) => <><strong>{r.subject}</strong><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{v}</Typography></> },
    {
      id: 'status', label: 'Status', minWidth: 150,
      format: (v, r) => (hasPermission('admin:enquiries:write') ? (
        <TextField select size="small" value={v} onClick={(e) => e.stopPropagation()} onChange={async (e) => { if (await run(SET_CONTACT_STATUS, { id: r.id, status: e.target.value }, { silent: true })) list.refetch() }}>
          {STATUS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>
      ) : v),
    },
  ]
  return (
    <PageContainer>
      <PageHeader title="Contact messages" subtitle="Questions sent from the website contact form (no account needed)" count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} />
        <FilterDropdown label="Status" options={STATUS} value={status} onChange={(v) => { setStatus(v); list.resetPage() }} allLabel="All" />
      </Toolbar>
      <CustomTable tableId="contact" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} />
    </PageContainer>
  )
}

export default ContactMessages
