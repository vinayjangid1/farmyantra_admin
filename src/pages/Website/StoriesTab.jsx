/** Farmer stories: real customers' photos and words for the home page, with recorded consent. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, Rating, Stack, Switch, TextField, Typography } from '@mui/material'
import { Camera, Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog, SidebarPanel } from '@/shared/components'
import { I18nField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { CUSTOMER_STORIES, SAVE_CUSTOMER_STORY, DELETE_CUSTOMER_STORY } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'

const StoriesTab = ({ canWrite }) => {
  const { data, refetch } = useQuery(CUSTOMER_STORIES, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const list = data?.customerStories || []
  const open = (s) => { setPhoto(null); setEdit(s) }
  const save = async () => {
    if (await run(SAVE_CUSTOMER_STORY, { id: edit.id || null, photo, input: edit })) { setEdit(null); refetch() }
  }
  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Photos and words of real farmers who bought from you. Get their permission first and note how they agreed.</Typography>
        {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => open({ customer_name: '', location: '', machine_name: '', quote_i18n: { en: '' }, rating: 5, consent_note: '', display_order: list.length + 1, is_published: false })}>Add story</Button>}
      </Stack>
      {!list.length && <Alert severity="info">No stories yet. The farmer stories section stays hidden until you publish one.</Alert>}
      <Grid container spacing={2}>
        {list.map((s) => (
          <Grid item xs={12} sm={6} lg={4} key={s.id}>
            <Card sx={{ height: '100%', opacity: s.is_published ? 1 : 0.65 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Avatar src={s.photo_url ? mediaUrl(s.photo_url) : undefined} sx={{ width: 56, height: 56 }}>{s.customer_name?.[0]}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>{s.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{[s.location, s.machine_name].filter(Boolean).join(' · ')}</Typography>
                  </Box>
                  <Chip size="small" label={s.is_published ? 'Shown' : 'Hidden'} color={s.is_published ? 'success' : 'default'} />
                </Stack>
                {s.rating && <Rating size="small" value={s.rating} readOnly />}
                <Typography variant="body2" sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{s.quote_i18n?.en}”</Typography>
                {canWrite && (
                  <Stack direction="row" sx={{ mt: 1 }}>
                    <Button size="small" startIcon={<Pencil size={14} />} onClick={() => open(s)}>Edit</Button>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" color="error" onClick={() => setConfirm(s)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Edit story' : 'Add story'} onSave={save} loading={loading}>
        {edit && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={photo ? URL.createObjectURL(photo) : edit.photo_url ? mediaUrl(edit.photo_url) : undefined} sx={{ width: 84, height: 84 }}>{edit.customer_name?.[0]}</Avatar>
              <Button component="label" variant="outlined" startIcon={<Camera size={16} />}>{photo ? photo.name : 'Upload farmer photo'}<input hidden type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></Button>
            </Stack>
            <TextField size="small" label="Farmer's name" value={edit.customer_name} onChange={(e) => setEdit({ ...edit, customer_name: e.target.value })} />
            <TextField size="small" label="Village / district, state" placeholder="Sikar, Rajasthan" value={edit.location || ''} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
            <TextField size="small" label="Machine they bought" placeholder="Kisan Pro Rotary Tiller" value={edit.machine_name || ''} onChange={(e) => setEdit({ ...edit, machine_name: e.target.value })} />
            <I18nField label="What they said" multiline rows={3} requiredEn value={edit.quote_i18n} onChange={(v) => setEdit({ ...edit, quote_i18n: v })} />
            <Box><Typography variant="caption">Rating</Typography><br /><Rating value={Number(edit.rating) || 0} onChange={(_e, v) => setEdit({ ...edit, rating: v })} /></Box>
            <TextField size="small" required multiline minRows={2} label="How they agreed to share" placeholder="Consent form signed at delivery, 12 Oct 2026" value={edit.consent_note || ''} onChange={(e) => setEdit({ ...edit, consent_note: e.target.value })} />
            <TextField size="small" type="number" label="Order" value={edit.display_order} onChange={(e) => setEdit({ ...edit, display_order: e.target.value })} />
            <FormControlLabel control={<Switch checked={Boolean(edit.is_published)} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} />} label="Show on website" />
          </Stack>
        )}
      </SidebarPanel>
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Remove story?" message={`${confirm?.customer_name}'s story will be removed from the website.`} loading={loading}
        onConfirm={async () => { if (await run(DELETE_CUSTOMER_STORY, { id: confirm.id })) { setConfirm(null); refetch() } }} />
    </Box>
  )
}

export default StoriesTab
