/**
 * Production board (§26): every open manufacturing job with its current
 * stage. Tap a job to update stages from the workshop floor (phone-sized).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Chip, FormControlLabel, Grid, LinearProgress, Link, Stack, Switch, Typography } from '@mui/material'

import { CustomTextField, EmptyState, FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { usePermissions } from '@/features/permissions'
import { MANUFACTURING_JOBS, MANUFACTURING_JOB } from '@/services/admin.api'
import { StageList } from '@/features/fulfilment'
import { en, fmtDay } from '@/features/fulfilment/utils'
import { JobTools } from '@/pages/Orders/order/ProductionPanel'

const JobDrawer = ({ jobId, onClose, canWrite, onChanged }) => {
  const { data, refetch } = useQuery(MANUFACTURING_JOB, { variables: { id: jobId }, skip: !jobId, fetchPolicy: 'network-only' })
  const job = data?.manufacturingJob
  const changed = () => { refetch(); onChanged() }
  return (
    <SidebarPanel open={Boolean(jobId)} onClose={onClose} title={job ? `${job.item?.order_number} · ${job.item?.description}` : 'Job'}>
      {job && (
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2">{job.item.customer_name} · Qty {job.item.quantity}</Typography>
            <Typography variant="caption" color="text.secondary">Ready {fmtDay(job.item.estimated_ready_min_date)} – {fmtDay(job.item.revised_ready_date || job.item.estimated_ready_max_date)}</Typography>
            <Box><Link component={RouterLink} to={`/orders/${job.order_id}?tab=production`}>Open order</Link></Box>
          </Box>
          <StageList job={job} canWrite={canWrite} onChanged={changed} />
          {canWrite && !['completed', 'cancelled'].includes(job.status) && <JobTools job={job} item={job.item} onChanged={changed} />}
        </Stack>
      )}
    </SidebarPanel>
  )
}

const ProductionBoard = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:manufacturing:write')
  const [status, setStatus] = useState('all')
  const [delayed, setDelayed] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, delayed: delayed || undefined, search: search || undefined }), [status, delayed, search])
  const list = usePagedQuery(MANUFACTURING_JOBS, 'manufacturingJobs', variables, { rowsPerPage: 60 })
  return (
    <PageContainer>
      <PageHeader title="Production" subtitle="Made-to-order items being built. Updates with photos reach the customer's order tracker." count={list.total} />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Order, customer, item…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
        <FilterDropdown label="Status" value={status} onChange={setStatus} allLabel="Open jobs" options={['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((s) => ({ value: s, label: humanize(s) }))} />
        <FormControlLabel control={<Switch checked={delayed} onChange={(e) => setDelayed(e.target.checked)} />} label="Delayed only" />
      </Toolbar>
      {!list.loading && !list.rows.length && <EmptyState title="No jobs" message="Jobs appear when an order with made-to-order items is accepted." />}
      <Grid container spacing={1.5}>
        {list.rows.map((j) => (
          <Grid item xs={12} sm={6} lg={4} key={j.id}>
            <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: j.is_delayed ? 'error.main' : j.status === 'in_progress' ? 'warning.main' : 'divider' }}>
              <CardActionArea onClick={() => setOpen(j.id)}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 800, flex: 1 }} noWrap>{j.description}</Typography>
                    <StatusChip status={j.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{j.order_number} · {j.customer_name} · Qty {j.quantity}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
                    <LinearProgress variant="determinate" value={(j.stages_done / Math.max(1, j.stages_total)) * 100} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">{j.stages_done}/{j.stages_total}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                    {j.current_stage && <Chip size="small" label={en(j.current_stage.name_i18n)} />}
                    {j.is_delayed && <Chip size="small" color="error" label="Delayed" />}
                    {(j.revised_ready_date || j.estimated_ready_max_date) && <Chip size="small" variant="outlined" label={`Ready by ${fmtDay(j.revised_ready_date || j.estimated_ready_max_date)}`} />}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      <JobDrawer jobId={open} onClose={() => setOpen(null)} canWrite={canWrite} onChanged={list.refetch} />
    </PageContainer>
  )
}

export default ProductionBoard
