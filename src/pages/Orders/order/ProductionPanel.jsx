/** Manufacturing jobs for the order's made-to-order items (§26). */
import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material'

import { SidebarPanel } from '@/shared/components'
import { StatusChip } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { ADD_MANUFACTURING_UPDATE, REVISE_ITEM_ESTIMATE, SET_MANUFACTURING_DELAY } from '@/services/admin.api'
import { MediaPicker, MediaThumbs, StageList } from '@/features/fulfilment'
import { dateOnly, fmtDay } from '@/features/fulfilment/utils'
import { formatDate } from '@/utils/dateFormatter'

export const JobTools = ({ job, item, onChanged }) => {
  const { run, loading } = useAction()
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({})
  const [media, setMedia] = useState([])
  const close = () => { setMode(null); setForm({}); setMedia([]) }
  const save = async () => {
    let ok
    if (mode === 'update') ok = await run(ADD_MANUFACTURING_UPDATE, { jobId: job.id, note: form.note, visibility: form.internal ? 'internal' : 'customer', media: media.length ? media : null })
    if (mode === 'estimate') ok = await run(REVISE_ITEM_ESTIMATE, { orderItemId: job.order_item_id, minDate: form.min, maxDate: form.max, reason: form.reason, customerVisible: !form.internal })
    if (mode === 'delay') ok = await run(SET_MANUFACTURING_DELAY, { jobId: job.id, delayed: !job.is_delayed, reason: form.reason || null, customerVisible: !form.internal })
    if (ok) { close(); onChanged() }
  }
  const titles = { update: 'Post a progress update', estimate: 'Revise ready date', delay: job.is_delayed ? 'Clear delay' : 'Mark as delayed' }
  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        <Button size="small" variant="outlined" onClick={() => setMode('update')}>Post update</Button>
        <Button size="small" variant="outlined" onClick={() => { setForm({ min: dateOnly(item?.estimated_ready_min_date), max: dateOnly(item?.revised_ready_date || item?.estimated_ready_max_date) }); setMode('estimate') }}>Revise date</Button>
        <Button size="small" color={job.is_delayed ? 'success' : 'warning'} onClick={() => setMode('delay')}>{job.is_delayed ? 'Clear delay' : 'Mark delayed'}</Button>
      </Stack>
      <SidebarPanel open={Boolean(mode)} onClose={close} title={titles[mode] || ''} onSave={save} loading={loading} saveLabel="Save">
        <Stack spacing={2}>
          {mode === 'update' && (
            <>
              <TextField size="small" multiline minRows={3} label="Update" value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <MediaPicker files={media} onChange={setMedia} />
            </>
          )}
          {mode === 'estimate' && (
            <>
              <Alert severity="info">The customer sees both the original and the revised date with your reason (§26.3).</Alert>
              <Grid container spacing={1.5}>
                <Grid item xs={6}><TextField size="small" fullWidth type="date" label="Earliest" InputLabelProps={{ shrink: true }} value={form.min || ''} onChange={(e) => setForm({ ...form, min: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField size="small" fullWidth type="date" label="Latest" InputLabelProps={{ shrink: true }} value={form.max || ''} onChange={(e) => setForm({ ...form, max: e.target.value })} /></Grid>
              </Grid>
              <TextField size="small" multiline minRows={2} required label="Reason" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </>
          )}
          {mode === 'delay' && !job.is_delayed && <TextField size="small" multiline minRows={2} required label="Reason for the delay" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />}
          {mode && <FormControlLabel control={<Switch checked={Boolean(form.internal)} onChange={(e) => setForm({ ...form, internal: e.target.checked })} />} label="Team only (hide from the customer)" />}
        </Stack>
      </SidebarPanel>
    </>
  )
}

const ProductionPanel = ({ order, canWrite, refetch }) => {
  if (!order.jobs.length) {
    return <Alert severity="info">No production jobs. Jobs are created automatically for made-to-order items when the order is confirmed.</Alert>
  }
  return (
    <Grid container spacing={2}>
      {order.jobs.map((job) => {
        const item = order.items.find((i) => i.id === job.order_item_id)
        return (
          <Grid item xs={12} md={6} key={job.id}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 800, flex: 1 }}>{item?.description} × {item?.quantity}</Typography>
                  <StatusChip status={job.status} />
                  {job.is_delayed && <StatusChip status="failed" label="Delayed" />}
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                  Ready {fmtDay(item?.estimated_ready_min_date)} – {fmtDay(item?.revised_ready_date || item?.estimated_ready_max_date)}
                  {item?.revised_ready_date && ` (originally ${fmtDay(item.original_ready_max_date)})`}
                  {job.delay_reason ? ` · ${job.delay_reason}` : ''}
                </Typography>
                <StageList job={job} canWrite={canWrite} onChanged={refetch} />
                {canWrite && !['completed', 'cancelled'].includes(job.status) && <JobTools job={job} item={item} onChanged={refetch} />}
                {job.updates.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Updates</Typography>
                    {job.updates.slice().reverse().slice(0, 8).map((u) => (
                      <Box key={u.id} sx={{ borderLeft: 3, borderColor: u.visibility === 'customer' ? 'primary.main' : 'divider', pl: 1.25, mb: 1 }}>
                        <Typography variant="body2">{u.note || (u.stage_status ? `Stage ${u.stage_status.replace(/_/g, ' ')}` : 'Update')}</Typography>
                        <MediaThumbs media={u.media} />
                        <Typography variant="caption" color="text.secondary">{u.author_name} · {formatDate(u.created_at, 'short')} · {u.visibility === 'customer' ? 'customer can see' : 'team only'}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProductionPanel
