/** Audit log (§14.7, §18): who changed what, when, and why. Read-only. */
import { useMemo, useState } from 'react'
import { Box, Chip, Stack, TextField, Typography } from '@mui/material'

import { CustomTable, CustomTextField, ErrorState, FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { usePagedQuery, Toolbar, KeyValue } from '@/shared/components/fy'
import { AUDIT_LOGS } from '@/services/admin.api'
import { formatDate, formatRelativeTime } from '@/utils/dateFormatter'

const ENTITIES = ['product', 'category', 'enquiry', 'quotation', 'order', 'customer', 'review', 'promotion', 'catalogue', 'content_page', 'settings', 'team_member', 'role']

const AuditLog = () => {
  const [entity, setEntity] = useState('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState(null)
  const variables = useMemo(() => ({
    entity: entity === 'all' ? undefined : entity,
    search: search.trim() || undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59` : undefined,
  }), [entity, search, from, to])
  const list = usePagedQuery(AUDIT_LOGS, 'auditLogs', variables, { rowsPerPage: 50 })
  const reset = (fn) => (v) => { fn(v); list.resetPage() }
  const columns = [
    { id: 'created_at', label: 'When', minWidth: 140, format: (v) => <><Typography variant="body2">{formatRelativeTime(v)}</Typography><Typography variant="caption" color="text.secondary">{formatDate(v, 'short')}</Typography></> },
    { id: 'actor_name', label: 'Who', format: (v, r) => <>{v || r.actor_type}<Typography variant="caption" display="block" color="text.secondary">{r.actor_type}</Typography></> },
    { id: 'action', label: 'Action', format: (v) => <Chip size="small" label={v} sx={{ fontFamily: 'monospace' }} /> },
    { id: 'entity', label: 'Record', format: (v, r) => `${v}${r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}` : ''}` },
    { id: 'reason', label: 'Reason', minWidth: 200, format: (v) => v || '—' },
  ]
  return (
    <PageContainer>
      <PageHeader title="Audit log" subtitle="Every price, status, permission and content change. Entries cannot be edited or deleted." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Action, person, reason…" sx={{ minWidth: 240 }} />
        <FilterDropdown label="Record type" options={ENTITIES.map((e) => ({ value: e, label: e }))} value={entity} onChange={reset(setEntity)} />
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => reset(setFrom)(e.target.value)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => reset(setTo)(e.target.value)} />
      </Toolbar>
      {list.error ? <ErrorState message={list.error.message} /> : (
        <CustomTable tableId="audit" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total}
          onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={setSelected} />
      )}
      <SidebarPanel open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.action || ''}>
        {selected && (
          <Stack spacing={2}>
            <KeyValue label="When">{formatDate(selected.created_at, 'long')}</KeyValue>
            <KeyValue label="Who">{selected.actor_name || '—'} ({selected.actor_type}){selected.ip ? ` · ${selected.ip}` : ''}</KeyValue>
            <KeyValue label="Record">{selected.entity} {selected.entity_id}</KeyValue>
            <KeyValue label="Reason">{selected.reason}</KeyValue>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }} color="text.secondary">Changes</Typography>
              <Box component="pre" sx={{ m: 0, mt: 0.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, fontSize: 12, overflow: 'auto', maxHeight: 480 }}>
                {JSON.stringify(selected.changes, null, 2) || '—'}
              </Box>
            </Box>
          </Stack>
        )}
      </SidebarPanel>
    </PageContainer>
  )
}

export default AuditLog
