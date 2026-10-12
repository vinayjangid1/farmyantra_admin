/** One delivery issue: messages, status and resolution (§28.2). Used on the order and the issues page. */
import { useState } from 'react'
import { Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { StatusChip, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { UPDATE_DELIVERY_ISSUE, ADD_DELIVERY_ISSUE_MESSAGE } from '@/services/admin.api'
import { formatDate } from '@/utils/dateFormatter'
import { MediaThumbs } from './index'
import { ISSUE_STATUSES, RESOLUTIONS } from './utils'


const IssueThread = ({ issue, canWrite, onChanged }) => {
  const { run, loading } = useAction()
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)
  const [status, setStatus] = useState(issue.status)
  const [resolution, setResolution] = useState(issue.resolution_type || '')
  const [notes, setNotes] = useState(issue.resolution_notes || '')
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 800 }}>{issue.issue_number}</Typography>
        <StatusChip status={issue.status} />
        <Typography variant="body2" color="text.secondary">{humanize(issue.issue_type)} · {formatDate(issue.created_at, 'short')}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ mb: 1 }}>{issue.description}</Typography>
      <MediaThumbs media={issue.media} />
      {issue.messages.map((m) => (
        <Box key={m.id} sx={{ my: 1, p: 1.25, borderRadius: 1.5, bgcolor: m.author_type === 'customer' ? 'action.hover' : m.visibility === 'internal' ? 'warning.50' : 'primary.50', border: 1, borderColor: 'divider' }}>
          <Typography variant="body2">{m.body}</Typography>
          <Typography variant="caption" color="text.secondary">{m.author_name} · {formatDate(m.created_at, 'short')}{m.visibility === 'internal' ? ' · team only' : ''}</Typography>
        </Box>
      ))}
      {canWrite && (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <TextField size="small" multiline minRows={2} label="Reply" value={body} onChange={(e) => setBody(e.target.value)} />
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" disabled={!body.trim() || loading} onClick={async () => { if (await run(ADD_DELIVERY_ISSUE_MESSAGE, { id: issue.id, body, visibility: internal ? 'internal' : 'customer' })) { setBody(''); onChanged() } }}>Send</Button>
            <Button size="small" onClick={() => setInternal(!internal)}>{internal ? 'Team-only note' : 'Visible to customer'}</Button>
          </Stack>
          <Grid container spacing={1.25}>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>{ISSUE_STATUSES.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)}><MenuItem value="">—</MenuItem>{RESOLUTIONS.map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" multiline label="Resolution notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></Grid>
          </Grid>
          <Box><Button size="small" variant="outlined" disabled={loading} onClick={async () => { if (await run(UPDATE_DELIVERY_ISSUE, { id: issue.id, input: { status, resolution_type: resolution || null, resolution_notes: notes || null } })) onChanged() }}>Save status</Button></Box>
        </Stack>
      )}
    </Box>
  )
}

export default IssueThread
