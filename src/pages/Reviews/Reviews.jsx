/**
 * Review moderation (§8, §22.7). Two separate decisions:
 *  1. Verification — did this customer actually buy the product?
 *  2. Moderation   — is the content acceptable?
 * A review is public only when verified AND approved.
 */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Grid, Rating, Stack, TextField, Typography } from '@mui/material'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, SidebarPanel, ErrorState } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, KeyValue, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { REVIEWS, REVIEW, MODERATE_REVIEW } from '@/services/admin.api'
import { reviewMediaUrl, mediaUrl } from '@/services/files'
import { formatDate, formatRelativeTime } from '@/utils/dateFormatter'

const FLAGS = ['spam', 'abusive', 'irrelevant', 'unsafe_media', 'off_topic']

const ReviewMedia = ({ media }) => {
  const [urls, setUrls] = useState({})
  useEffect(() => {
    let cancelled = false
    const created = []
    media.forEach(async (m) => {
      try {
        const url = m.is_approved && m.public_url ? mediaUrl(m.public_url) : await reviewMediaUrl(m.id)
        if (!m.is_approved) created.push(url)
        if (!cancelled) setUrls((u) => ({ ...u, [m.id]: url }))
      } catch { /* shown as missing */ }
    })
    return () => { cancelled = true; created.forEach((u) => URL.revokeObjectURL(u)) }
  }, [media])
  if (!media.length) return null
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {media.map((m) => (
        <Box key={m.id} sx={{ width: 120, height: 120, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', border: 1, borderColor: 'divider' }}>
          {urls[m.id] && (m.media_type === 'video'
            ? <video src={urls[m.id]} controls style={{ width: '100%', height: '100%' }} />
            : <a href={urls[m.id]} target="_blank" rel="noopener noreferrer"><img src={urls[m.id]} alt="Customer upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></a>)}
        </Box>
      ))}
    </Stack>
  )
}

const ReviewPanel = ({ id, onClose, onChanged }) => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:reviews:write')
  const { data, refetch } = useQuery(REVIEW, { variables: { id }, skip: !id, fetchPolicy: 'network-only' })
  const { run, loading } = useAction()
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [flags, setFlags] = useState([])
  const r = data?.review
  useEffect(() => { setReason(''); setFeedback(r?.customer_feedback || ''); setFlags(r?.flags || []) }, [r?.id, r?.customer_feedback, r?.flags])

  const act = async (action) => {
    const ok = await run(MODERATE_REVIEW, { id, action, reason: reason || undefined, customerFeedback: feedback || undefined, flags })
    if (ok) { refetch(); onChanged() }
  }
  return (
    <SidebarPanel open={Boolean(id)} onClose={onClose} title="Review">
      {r && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={r.status} /><Rating value={r.rating} readOnly size="small" /></Stack>
          <Box>
            {r.title && <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{r.title}</Typography>}
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} lang={r.language}>{r.body}</Typography>
          </Box>
          <ReviewMedia media={r.media} />
          <Grid container spacing={2}>
            <Grid item xs={6}><KeyValue label="Shown as">{r.display_name}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Submitted">{formatDate(r.created_at, 'short')}</KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Verification"><StatusChip status={r.verification_status} /></KeyValue></Grid>
            <Grid item xs={6}><KeyValue label="Moderation"><StatusChip status={r.moderation_status} /></KeyValue></Grid>
          </Grid>
          {r.purchase_record ? (
            <Alert severity="success" action={<Button size="small" onClick={() => navigate(`/orders/${r.purchase_record.id}`)}>Open order</Button>}>
              Purchase found — order is {humanize(r.purchase_record.status)}.
            </Alert>
          ) : <Alert severity="warning">No order with this product found for this customer. Verify only with offline proof (invoice, dealer confirmation).</Alert>}

          {canWrite && (
            <>
              <TextField label="Internal reason" size="small" multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} helperText="Required to reject, hide or request changes. Not shown to the customer." />
              <TextField label="Message to the customer (optional)" size="small" multiline minRows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <Stack direction="row" flexWrap="wrap">
                {FLAGS.map((f) => (
                  <FormControlLabel key={f} control={<Checkbox size="small" checked={flags.includes(f)} onChange={(e) => setFlags((fs) => (e.target.checked ? [...fs, f] : fs.filter((x) => x !== f)))} />} label={humanize(f)} />
                ))}
              </Stack>
              <Typography variant="overline">Verification</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" color="success" disabled={loading || r.verification_status === 'verified'} onClick={() => act('verify')}>Mark verified buyer</Button>
                <Button variant="outlined" color="error" disabled={loading || !reason.trim()} onClick={() => act('reject_verification')}>Not a buyer</Button>
              </Stack>
              <Typography variant="overline">Content</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" disabled={loading || r.moderation_status === 'approved'} onClick={() => act('approve')}>Approve</Button>
                <Button variant="outlined" color="warning" disabled={loading || !reason.trim()} onClick={() => act('request_changes')}>Request changes</Button>
                <Button variant="outlined" disabled={loading || !reason.trim()} onClick={() => act('hide')}>Hide</Button>
                <Button variant="outlined" color="error" disabled={loading || !reason.trim()} onClick={() => act('reject')}>Reject</Button>
              </Stack>
            </>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>History</Typography>
            {r.events.length === 0 && <Typography variant="body2" color="text.secondary">No decisions yet.</Typography>}
            {r.events.map((e) => (
              <Typography key={e.id} variant="body2" sx={{ mb: 0.5 }}>
                <strong>{humanize(e.action)}</strong> by {e.actor_name || 'system'} · {formatRelativeTime(e.created_at)}{e.reason ? ` — ${e.reason}` : ''}
              </Typography>
            ))}
          </Box>
        </Stack>
      )}
    </SidebarPanel>
  )
}

const Reviews = () => {
  const [queue, setQueue] = useState(true)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('all')
  const [moderation, setModeration] = useState('all')
  const [selected, setSelected] = useState(null)
  const variables = useMemo(() => ({
    queue: queue || undefined,
    search: search.trim() || undefined,
    rating: rating === 'all' ? undefined : Number(rating),
    moderationStatus: moderation === 'all' ? undefined : moderation,
  }), [queue, search, rating, moderation])
  const list = usePagedQuery(REVIEWS, 'reviews', variables)
  const reset = (fn) => (v) => { fn(v); list.resetPage() }

  const columns = [
    { id: 'product_name', label: 'Product', minWidth: 200, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 700 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.customer_name || r.display_name} · {r.customer_phone}</Typography></> },
    { id: 'rating', label: 'Rating', format: (v) => <Rating value={v} readOnly size="small" /> },
    { id: 'body', label: 'Review', minWidth: 260, format: (v, r) => <Typography variant="body2" noWrap sx={{ maxWidth: 360 }}>{r.title ? <strong>{r.title} — </strong> : null}{v}</Typography> },
    { id: 'media_count', label: 'Media', align: 'right', format: (v) => (v ? <Chip size="small" label={v} /> : '—') },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
    { id: 'created_at', label: 'Submitted', format: (v) => formatRelativeTime(v) },
  ]
  return (
    <PageContainer>
      <PageHeader title="Reviews" subtitle="Verify the buyer, then approve the content. Only verified + approved reviews appear on the website." count={list.total} />
      <Toolbar>
        <FormControlLabel control={<Checkbox checked={queue} onChange={(e) => reset(setQueue)(e.target.checked)} />} label="Needs a decision" />
        <CustomTextField label="Search" value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Text, name, product…" sx={{ minWidth: 240 }} />
        <FilterDropdown label="Rating" options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` }))} value={rating} onChange={reset(setRating)} />
        <FilterDropdown label="Moderation" options={['pending', 'approved', 'changes_requested', 'hidden', 'rejected'].map((s) => ({ value: s, label: humanize(s) }))} value={moderation} onChange={reset(setModeration)} />
      </Toolbar>
      {list.error ? <ErrorState message={list.error.message} /> : (
        <CustomTable tableId="reviews" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total}
          onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={(r) => setSelected(r.id)} />
      )}
      <ReviewPanel id={selected} onClose={() => setSelected(null)} onChanged={() => list.refetch()} />
    </PageContainer>
  )
}

export default Reviews
