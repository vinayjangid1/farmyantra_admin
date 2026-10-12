/**
 * Building blocks shared by the order screen, the production board and the
 * shipments board (§26–§28): stage updates with photos, shipment events,
 * order-change diffs and small status helpers.
 */
import { useState } from 'react'
import {
  Alert, Box, Button, Chip, FormControlLabel, LinearProgress, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material'
import { Camera, CheckCircle2, Circle, CircleDot, SkipForward } from 'lucide-react'

import { SidebarPanel } from '@/shared/components'
import { humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { UPDATE_MANUFACTURING_STAGE, ADD_SHIPMENT_EVENT } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'
import { en, fmtDay, SHIPMENT_EVENTS } from './utils'


/** Up to 6 photos / short videos (§26.2). */
export const MediaPicker = ({ files, onChange, max = 6 }) => (
  <Box>
    <Button component="label" size="small" variant="outlined" startIcon={<Camera size={16} />}>
      Add photos / video
      <input hidden multiple type="file" accept="image/*,video/mp4,video/quicktime,video/webm" capture="environment"
        onChange={(e) => { onChange([...files, ...Array.from(e.target.files || [])].slice(0, max)); e.target.value = '' }} />
    </Button>
    {files.length > 0 && (
      <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
        {files.map((f, i) => <Chip key={`${f.name}-${i}`} size="small" label={f.name} onDelete={() => onChange(files.filter((_x, j) => j !== i))} />)}
      </Stack>
    )}
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Up to {max} files. Images are compressed; videos up to 50 MB.</Typography>
  </Box>
)

/** Thumbnails for signed media from the API (images open full size, videos play inline). */
export const MediaThumbs = ({ media = [], size = 64 }) => (media.length ? (
  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
    {media.map((m) => (m.media_type === 'video'
      ? <Box key={m.id} component="video" src={m.url} controls preload="metadata" sx={{ width: size * 2, borderRadius: 1 }} />
      : (
        <Box key={m.id} component="a" href={m.url} target="_blank" rel="noopener">
          <Box component="img" src={m.thumbnail_url || m.url} alt="" loading="lazy" sx={{ width: size, height: size, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
        </Box>
      )))}
  </Stack>
) : null)

const STAGE_ICON = { completed: CheckCircle2, skipped: SkipForward, in_progress: CircleDot, pending: Circle }

/** Vertical list of stages with one-tap actions. */
export const StageList = ({ job, canWrite, onChanged }) => {
  const [stage, setStage] = useState(null)
  const done = job.stages.filter((s) => ['completed', 'skipped'].includes(s.status)).length
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <LinearProgress variant="determinate" value={(done / Math.max(1, job.stages.length)) * 100} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{done}/{job.stages.length}</Typography>
      </Stack>
      {job.stages.map((s) => {
        const Icon = STAGE_ICON[s.status] || Circle
        return (
          <Stack key={s.id} direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ color: s.status === 'completed' ? 'success.main' : s.status === 'in_progress' ? 'warning.main' : 'text.disabled', display: 'flex' }}><Icon size={18} /></Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{en(s.name_i18n)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {humanize(s.status)} · plan {s.planned_days} day{s.planned_days === 1 ? '' : 's'}{s.completed_at ? ` · ${fmtDay(s.completed_at)}` : ''}{s.customer_visible_default ? '' : ' · internal'}
              </Typography>
            </Box>
            {canWrite && !['completed', 'cancelled'].includes(job.status) && (
              <Button size="small" onClick={() => setStage(s)} sx={{ minHeight: 40 }}>{s.status === 'pending' ? 'Start' : s.status === 'in_progress' ? 'Update' : 'Edit'}</Button>
            )}
          </Stack>
        )
      })}
      <StageDialog stage={stage} onClose={() => setStage(null)} onSaved={() => { setStage(null); onChanged?.() }} />
    </Box>
  )
}

export const StageDialog = ({ stage, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const [status, setStatus] = useState('completed')
  const [note, setNote] = useState('')
  const [visibility, setVisibility] = useState('')
  const [skipReason, setSkipReason] = useState('')
  const [media, setMedia] = useState([])
  const open = Boolean(stage)
  const reset = () => { setStatus('completed'); setNote(''); setVisibility(''); setSkipReason(''); setMedia([]) }
  const save = async () => {
    const ok = await run(UPDATE_MANUFACTURING_STAGE, {
      jobStageId: stage.id, status, note: note || null, visibility: visibility || null, skipReason: status === 'skipped' ? skipReason : null, media: media.length ? media : null,
    })
    if (ok) { reset(); onSaved() }
  }
  return (
    <SidebarPanel open={open} onClose={() => { reset(); onClose() }} title={stage ? `Stage: ${en(stage.name_i18n)}` : ''} onSave={save} saveLabel="Save update" loading={loading}>
      {stage && (
        <Stack spacing={2}>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['in_progress', 'completed', 'skipped', 'pending'].map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}
          </TextField>
          {status === 'skipped' && <TextField size="small" label="Why is this stage skipped? (required)" value={skipReason} onChange={(e) => setSkipReason(e.target.value)} />}
          <TextField size="small" multiline minRows={2} label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <TextField select size="small" label="Who sees this update" value={visibility || (stage.customer_visible_default ? 'customer' : 'internal')} onChange={(e) => setVisibility(e.target.value)}>
            <MenuItem value="customer">Customer and team</MenuItem>
            <MenuItem value="internal">Team only</MenuItem>
          </TextField>
          <MediaPicker files={media} onChange={setMedia} />
          <Alert severity="info">Customers get at most one email per order per hour for progress updates.</Alert>
        </Stack>
      )}
    </SidebarPanel>
  )
}


export const ShipmentEventDialog = ({ shipment, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const [form, setForm] = useState({ event_type: 'picked_up', note: '', location_text: '', occurred_at: '', customer_visible: true, revised_delivery_date: '' })
  const [media, setMedia] = useState([])
  const rule = SHIPMENT_EVENTS.find((e) => e.value === form.event_type)
  const save = async () => {
    const input = {
      event_type: form.event_type, note: form.note || null, location_text: form.location_text || null, customer_visible: form.customer_visible,
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : null, revised_delivery_date: form.revised_delivery_date || null,
    }
    if (await run(ADD_SHIPMENT_EVENT, { shipmentId: shipment.id, input, media: media.length ? media : null })) {
      setMedia([])
      setForm((f) => ({ ...f, note: '', location_text: '' }))
      onSaved()
    }
  }
  return (
    <SidebarPanel open={Boolean(shipment)} onClose={onClose} title={shipment ? `Update ${shipment.shipment_number}` : ''} onSave={save} saveLabel="Add update" loading={loading}>
      <Stack spacing={2}>
        <TextField select size="small" label="What happened" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
          {SHIPMENT_EVENTS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
        </TextField>
        <TextField size="small" label={rule?.location ? 'Location (required)' : 'Location (optional)'} placeholder="e.g. Ajmer" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} />
        <TextField size="small" multiline minRows={2} label={rule?.note ? (form.event_type === 'delayed' ? 'Reason for the delay (required)' : 'Update (required)') : 'Note (optional)'} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        {form.event_type === 'delayed' && <TextField size="small" type="date" label="New expected delivery date" InputLabelProps={{ shrink: true }} value={form.revised_delivery_date} onChange={(e) => setForm({ ...form, revised_delivery_date: e.target.value })} />}
        <TextField size="small" type="datetime-local" label="When (leave empty for now; up to 24 h back)" InputLabelProps={{ shrink: true }} value={form.occurred_at} onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} />
        <FormControlLabel control={<Switch checked={form.customer_visible} onChange={(e) => setForm({ ...form, customer_visible: e.target.checked })} />} label="Show to the customer" />
        <MediaPicker files={media} onChange={setMedia} />
      </Stack>
    </SidebarPanel>
  )
}

/** Human-readable diff of an order change (§25.4). */
export const VersionDiff = ({ diff }) => {
  if (!diff) return null
  if (diff.created) return <Typography variant="body2">New order created by the team.</Typography>
  const rows = []
  for (const a of diff.added || []) rows.push(<li key={`a${a.item_key}`}>Added <strong>{a.description}</strong> × {a.quantity} at {formatPaise(a.unit_price_paise)}</li>)
  for (const r of diff.removed || []) rows.push(<li key={`r${r.item_key}`}>Removed <strong>{r.description}</strong></li>)
  for (const c of diff.changed || []) {
    const parts = Object.entries(c.fields).map(([k, v]) => `${humanize(k)}: ${/paise/.test(k) ? `${formatPaise(v.from)} → ${formatPaise(v.to)}` : `${typeof v.from === 'object' ? '…' : v.from} → ${typeof v.to === 'object' ? '…' : v.to}`}`)
    rows.push(<li key={`c${c.item_key}`}><strong>{c.description}</strong>: {parts.join('; ')}</li>)
  }
  for (const [k, v] of Object.entries(diff.fields || {})) rows.push(<li key={`f${k}`}>{humanize(k)}: {/paise/.test(k) ? `${formatPaise(v.from)} → ${formatPaise(v.to)}` : 'changed'}</li>)
  return (
    <Box>
      <Box component="ul" sx={{ pl: 2.5, my: 0.5 }}>{rows.length ? rows : <li>No item changes</li>}</Box>
      {diff.totals && (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Total {formatPaise(diff.totals.from)} → {formatPaise(diff.totals.to)} ({diff.totals.delta >= 0 ? '+' : '−'}{formatPaise(Math.abs(diff.totals.delta))})
        </Typography>
      )}
    </Box>
  )
}
