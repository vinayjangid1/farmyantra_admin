/** Trusted partners: brand, bank and government logos for the scrolling strip on the home page. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { Pencil, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog, SidebarPanel } from '@/shared/components'
import { useAction } from '@/shared/hooks/useAction'
import { PARTNERS, SAVE_PARTNER, DELETE_PARTNER } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'

const KINDS = [['brand', 'Machine brand'], ['bank', 'Bank / finance'], ['government', 'Government scheme'], ['dealer', 'Dealer / service partner'], ['other', 'Other']]

const PartnersTab = ({ canWrite }) => {
  const { data, refetch } = useQuery(PARTNERS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const [logo, setLogo] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const list = data?.partners || []
  const open = (p) => { setLogo(null); setEdit(p) }
  const save = async () => {
    if (await run(SAVE_PARTNER, { id: edit.id || null, logo, input: edit })) { setEdit(null); refetch() }
  }
  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Logos scroll across the home page under “Trusted partners”. Use transparent PNG logos, about 400 × 160 px. Only add partners you actually work with.</Typography>
        {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => open({ name: '', kind: 'brand', website_url: '', display_order: list.length + 1, is_published: true })}>Add partner</Button>}
      </Stack>
      {!list.length && <Alert severity="info">No partners yet. The partner strip stays hidden until you publish at least one logo.</Alert>}
      <Grid container spacing={2}>
        {list.map((p) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={p.id}>
            <Card sx={{ height: '100%', opacity: p.is_published ? 1 : 0.6 }}>
              <CardContent>
                <Box sx={{ height: 70, display: 'grid', placeItems: 'center', mb: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
                  {p.logo_url ? <Box component="img" src={mediaUrl(p.logo_url)} alt={p.name} sx={{ maxWidth: '85%', maxHeight: 56, objectFit: 'contain' }} /> : <ImageIcon size={22} />}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{p.name}</Typography>
                <Chip size="small" label={p.is_published ? 'Shown' : 'Hidden'} color={p.is_published ? 'success' : 'default'} sx={{ mt: 0.5 }} />
                {canWrite && (
                  <Stack direction="row" sx={{ mt: 1 }}>
                    <IconButton size="small" onClick={() => open(p)} aria-label="Edit"><Pencil size={15} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirm(p)} aria-label="Delete"><Trash2 size={15} /></IconButton>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Edit partner' : 'Add partner'} onSave={save} loading={loading}>
        {edit && (
          <Stack spacing={2}>
            <Box sx={{ height: 110, display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: 'action.hover' }}>
              {logo ? <Box component="img" src={URL.createObjectURL(logo)} alt="" sx={{ maxHeight: 90, maxWidth: '80%' }} /> : edit.logo_url ? <Box component="img" src={mediaUrl(edit.logo_url)} alt="" sx={{ maxHeight: 90, maxWidth: '80%' }} /> : <Typography variant="caption">No logo yet</Typography>}
            </Box>
            <Button component="label" variant="outlined" startIcon={<ImageIcon size={16} />}>{logo ? logo.name : 'Upload logo'}<input hidden type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} /></Button>
            <TextField size="small" label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <TextField select size="small" label="Type" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>{KINDS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>
            <TextField size="small" label="Website (optional)" placeholder="https://…" value={edit.website_url || ''} onChange={(e) => setEdit({ ...edit, website_url: e.target.value })} />
            <TextField size="small" type="number" label="Order" value={edit.display_order} onChange={(e) => setEdit({ ...edit, display_order: e.target.value })} />
            <FormControlLabel control={<Switch checked={Boolean(edit.is_published)} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} />} label="Show on website" />
          </Stack>
        )}
      </SidebarPanel>
      <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Remove partner?" message={`${confirm?.name} will be removed from the website.`} loading={loading}
        onConfirm={async () => { if (await run(DELETE_PARTNER, { id: confirm.id })) { setConfirm(null); refetch() } }} />
    </Box>
  )
}

export default PartnersTab
