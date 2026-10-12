/**
 * Request lists customers started but did not send (§23.6). Call only
 * customers who agreed to be contacted; log every follow-up.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'

import { CustomTable, CustomTextField, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { humanize, usePagedQuery, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { ABANDONED_CARTS, CUSTOMER_CART, LOG_CART_FOLLOW_UP } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const OUTCOMES = ['contacted', 'not_interested', 'converted', 'do_not_contact']

const AbandonedCarts = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:carts:write')
  const [consentOnly, setConsentOnly] = useState(true)
  const [search, setSearch] = useState('')
  const variables = useMemo(() => ({ consentOnly, search: search || undefined }), [consentOnly, search])
  const list = usePagedQuery(ABANDONED_CARTS, 'abandonedCarts', variables)
  const [open, setOpen] = useState(null)
  const { data } = useQuery(CUSTOMER_CART, { variables: { customerId: open?.customer_id }, skip: !open, fetchPolicy: 'network-only' })
  const { run, loading } = useAction()
  const [outcome, setOutcome] = useState('contacted')
  const [note, setNote] = useState('')
  const view = data?.customerCart?.view
  return (
    <PageContainer>
      <PageHeader title="Unsent request lists" subtitle="Customers who added products but did not send their request." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Name or phone" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <FormControlLabel control={<Switch checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} />} label="Only customers who agreed to be contacted" />
      </Toolbar>
      <CustomTable tableId="abandoned-carts" rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total} onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={setOpen} columns={[
        { id: 'name', label: 'Customer', format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 700 }}>{v || 'No name'}</Typography><Typography variant="caption" color="text.secondary">{r.phone}{r.do_not_contact ? ' · do not contact' : ''}</Typography></> },
        { id: 'item_summary', label: 'Items', minWidth: 220 },
        { id: 'value_paise', label: 'Indicative value', align: 'right', format: (v) => formatPaise(v) },
        { id: 'last_activity_at', label: 'Last activity', format: (v) => formatDate(v, 'short') },
        { id: 'last_follow_up', label: 'Follow-up', format: (v) => (v ? humanize(v) : '—') },
      ]} />
      <SidebarPanel open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.name || open.phone}` : ''} loading={loading}
        onSave={canWrite ? async () => { if (await run(LOG_CART_FOLLOW_UP, { cartId: open.id, outcome, note })) { setOpen(null); setNote(''); list.refetch() } } : undefined} saveLabel="Log follow-up">
        {open && (
          <Stack spacing={2}>
            {open.do_not_contact && <Alert severity="error">This customer asked not to be contacted.</Alert>}
            {!open.marketing_opt_in && <Alert severity="warning">No marketing consent — contact only if they asked for help.</Alert>}
            <Button variant="outlined" href={`tel:${open.phone}`}>Call {open.phone}</Button>
            {(view?.lines || []).map((l) => (
              <Box key={l.id} sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.product?.name || "Product"} × {l.quantity}</Typography>
                <Typography variant="caption" color="text.secondary">{l.price_on_request ? 'Price on request' : formatPaise(l.total_paise)} · {humanize(l.validation_state)}</Typography>
              </Box>
            ))}
            {(data?.customerCart?.follow_ups || []).map((f) => <Typography key={f.id} variant="caption">{formatDate(f.created_at, 'short')} · {humanize(f.outcome)} · {f.actor_name}{f.note ? ` — ${f.note}` : ''}</Typography>)}
            {canWrite && (
              <>
                <TextField select size="small" label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>{OUTCOMES.map((o) => <MenuItem key={o} value={o}>{humanize(o)}</MenuItem>)}</TextField>
                <TextField size="small" multiline minRows={2} label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              </>
            )}
          </Stack>
        )}
      </SidebarPanel>
    </PageContainer>
  )
}

export default AbandonedCarts
