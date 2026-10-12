import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Grid, Link, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, KeyValue } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { CUSTOMERS, CUSTOMER, UPDATE_CUSTOMER } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const CustomerPanel = ({ id, onClose }) => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:customers:write')
  const { data, refetch } = useQuery(CUSTOMER, { variables: { id }, skip: !id, fetchPolicy: 'network-only' })
  const { run, loading } = useAction()
  const [notes, setNotes] = useState(null)
  const c = data?.customer
  return (
    <SidebarPanel open={Boolean(id)} onClose={onClose} title={c?.name || 'Customer'}>
      {c && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}><KeyValue label="Phone (verified)"><Link href={`tel:${c.phone}`}>{c.phone}</Link></KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Email">{c.email} {c.email && !c.email_verified ? '(unverified)' : ''}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Language">{c.preferred_language === 'hi' ? 'हिंदी' : 'English'}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Joined">{formatDate(c.created_at, 'short')}</KeyValue></Grid>
            <Grid item xs={12}><KeyValue label="Company / GSTIN">{[c.company_name, c.gstin].filter(Boolean).join(' · ') || null}</KeyValue></Grid>
            <Grid item xs={12}><KeyValue label="Address">{[c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ') || null}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Marketing consent">{c.marketing_opt_in ? 'Yes' : 'No'}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Status"><StatusChip status={c.status} /></KeyValue></Grid>
          </Grid>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Enquiries</Typography>
            {c.enquiries.map((e) => (
              <Stack key={e.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5, cursor: 'pointer' }} onClick={() => navigate(`/enquiries/${e.id}`)}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 140 }}>{e.enquiry_number}</Typography>
                <StatusChip status={e.status} /><Typography variant="body2">{formatPaise(e.total_paise)}</Typography>
              </Stack>
            ))}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Orders</Typography>
            {c.orders.length === 0 && <Typography variant="body2" color="text.secondary">None</Typography>}
            {c.orders.map((o) => (
              <Stack key={o.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.5, cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.id}`)}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 140 }}>{o.order_number}</Typography>
                <StatusChip status={o.status} /><Typography variant="body2">{formatPaise(o.total_paise)}</Typography>
              </Stack>
            ))}
          </Box>
          {canWrite && (
            <>
              <TextField label="Internal notes (team only)" multiline minRows={3} value={notes ?? c.internal_notes ?? ''} onChange={(e) => setNotes(e.target.value)} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={loading} onClick={async () => { if (await run(UPDATE_CUSTOMER, { id, input: { internal_notes: notes ?? c.internal_notes } }, { success: 'Notes saved' })) refetch() }}>Save notes</Button>
                <TextField select size="small" label="Account" value={c.status} onChange={async (e) => { if (await run(UPDATE_CUSTOMER, { id, input: { status: e.target.value } })) refetch() }}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </TextField>
              </Stack>
            </>
          )}
        </Stack>
      )}
    </SidebarPanel>
  )
}

const Customers = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const variables = useMemo(() => ({ search: search || undefined, status: status === 'all' ? undefined : status }), [search, status])
  const list = usePagedQuery(CUSTOMERS, 'customers', variables)
  const columns = [
    { id: 'name', label: 'Name', minWidth: 160, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 700 }}>{v || '(profile incomplete)'}</Typography><Typography variant="caption" color="text.secondary">{r.phone}</Typography></> },
    { id: 'email', label: 'Email', minWidth: 180 },
    { id: 'city', label: 'City', format: (v, r) => [v, r.state].filter(Boolean).join(', ') || '—' },
    { id: 'enquiry_count', label: 'Enquiries', align: 'right' },
    { id: 'order_count', label: 'Orders', align: 'right' },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
    { id: 'created_at', label: 'Joined', format: (v) => formatDate(v, 'short') },
  ]
  return (
    <PageContainer>
      <PageHeader title="Customers" subtitle="Phone-verified accounts created on the website" count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Name, phone, email, company, city…" value={search} onChange={(e) => { setSearch(e.target.value); list.resetPage() }} sx={{ minWidth: 280 }} />
        <FilterDropdown label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} value={status} onChange={(v) => { setStatus(v); list.resetPage() }} allLabel="All" />
      </Toolbar>
      <CustomTable tableId="customers" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={(r) => setSelected(r.id)} />
      <CustomerPanel id={selected} onClose={() => setSelected(null)} />
    </PageContainer>
  )
}

export default Customers
