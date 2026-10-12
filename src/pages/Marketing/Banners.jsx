/**
 * Website banners (§32.3): one image per language × device, with alt text,
 * focal point and a licence note for every piece of artwork.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, Chip, Grid, MenuItem, Slider, Stack, TextField, Typography } from '@mui/material'
import { Plus } from 'lucide-react'

import { FilterDropdown, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, humanize, Toolbar } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { BANNERS, SAVE_BANNER, SAVE_BANNER_VARIANT, DELETE_BANNER_VARIANT } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'

const PLACEMENTS = ['home_hero', 'home_strip', 'offers_page', 'category_top', 'product_promo']
const SLOTS = [['en', 'desktop'], ['en', 'mobile'], ['hi', 'desktop'], ['hi', 'mobile']]
const dt = (v) => (v ? String(v).slice(0, 16) : '')

const VariantEditor = ({ banner, slot, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const existing = banner.variants.find((v) => v.language === slot[0] && v.device === slot[1])
  const [form, setForm] = useState(existing || { headline: '', subheadline: '', cta_label: '', alt_text: '', licence_note: '', focal_x: 0.5, focal_y: 0.5 })
  const [image, setImage] = useState(null)
  const preview = image ? URL.createObjectURL(image) : existing ? mediaUrl(existing.image_url) : null
  return (
    <SidebarPanel open onClose={onClose} title={`${slot[0] === 'en' ? 'English' : 'हिंदी'} · ${slot[1]}`} loading={loading}
      onSave={async () => { if (await run(SAVE_BANNER_VARIANT, { bannerId: banner.id, image, input: { ...form, language: slot[0], device: slot[1] } })) onSaved() }}>
      <Stack spacing={2}>
        <Alert severity="info">{slot[1] === 'mobile' ? 'Mobile: 1080 × 1350 px (4:5) works best.' : 'Desktop: 2400 × 900 px (8:3) works best.'} Keep text out of the image — headlines below are added as real text.</Alert>
        {preview && (
          <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
            <Box component="img" src={preview} alt="" sx={{ width: '100%', display: 'block' }} />
            <Box sx={{ position: 'absolute', left: `${form.focal_x * 100}%`, top: `${form.focal_y * 100}%`, width: 18, height: 18, ml: '-9px', mt: '-9px', borderRadius: '50%', border: '3px solid #fff', boxShadow: 2 }} />
          </Box>
        )}
        <Button component="label" variant="outlined">{image ? image.name : existing ? 'Replace image' : 'Upload image'}<input hidden type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} /></Button>
        <Typography variant="caption">Focal point (kept visible when the image is cropped)</Typography>
        <Slider size="small" value={form.focal_x} min={0} max={1} step={0.05} onChange={(_e, v) => setForm({ ...form, focal_x: v })} aria-label="Focal X" />
        <Slider size="small" value={form.focal_y} min={0} max={1} step={0.05} onChange={(_e, v) => setForm({ ...form, focal_y: v })} aria-label="Focal Y" />
        <TextField size="small" label="Headline" value={form.headline || ''} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        <TextField size="small" label="Sub-headline" value={form.subheadline || ''} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} />
        <TextField size="small" label="Button label" value={form.cta_label || ''} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
        <TextField size="small" required label="Alt text (what the image shows)" value={form.alt_text || ''} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
        <TextField size="small" required label="Source & licence" placeholder="Own photo, workshop, Oct 2026" value={form.licence_note || ''} onChange={(e) => setForm({ ...form, licence_note: e.target.value })} />
        {existing && <Button color="error" onClick={async () => { if (await run(DELETE_BANNER_VARIANT, { bannerId: banner.id, language: slot[0], device: slot[1] })) onSaved() }}>Remove this image</Button>}
      </Stack>
    </SidebarPanel>
  )
}

const Banners = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:banners:write')
  const [placement, setPlacement] = useState('all')
  const { data, refetch } = useQuery(BANNERS, { variables: { placement: placement === 'all' ? undefined : placement }, fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const [slot, setSlot] = useState(null)
  const save = async () => {
    const input = { ...edit, starts_at: edit.starts_at || null, ends_at: edit.ends_at || null, priority: Number(edit.priority) || 100 }
    if (await run(SAVE_BANNER, { id: edit.id || null, input })) { setEdit(null); refetch() }
  }
  return (
    <PageContainer>
      <PageHeader title="Banners" subtitle="Hero and promotional banners for the website, scheduled and per language." />
      <Toolbar>
        <FilterDropdown label="Placement" value={placement} onChange={setPlacement} allLabel="All placements" options={PLACEMENTS.map((p) => ({ value: p, label: humanize(p) }))} />
        {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setEdit({ internal_name: '', placement: 'home_hero', status: 'draft', priority: 100, link_url: '' })}>New banner</Button>}
      </Toolbar>
      <Grid container spacing={2}>
        {(data?.banners || []).map((b) => (
          <Grid item xs={12} md={6} key={b.id}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, flex: 1 }}>{b.internal_name}</Typography>
                  <Chip size="small" label={humanize(b.placement)} />
                  <StatusChip status={b.display_state} />
                </Stack>
                <Grid container spacing={1}>
                  {SLOTS.map(([lang, device]) => {
                    const v = b.variants.find((x) => x.language === lang && x.device === device)
                    return (
                      <Grid item xs={6} sm={3} key={`${lang}-${device}`}>
                        <Box onClick={canWrite ? () => setSlot({ banner: b, slot: [lang, device] }) : undefined} sx={{ cursor: canWrite ? 'pointer' : 'default', border: 1, borderColor: 'divider', borderRadius: 1, aspectRatio: device === 'mobile' ? '4 / 5' : '8 / 3', bgcolor: 'action.hover', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {v ? <Box component="img" src={mediaUrl(v.image_url)} alt={v.alt_text} sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${v.focal_x * 100}% ${v.focal_y * 100}%` }} /> : <Typography variant="caption" color="text.secondary">+ {lang.toUpperCase()} {device}</Typography>}
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
                {canWrite && <Button size="small" sx={{ mt: 1 }} onClick={() => setEdit({ ...b, starts_at: dt(b.starts_at), ends_at: dt(b.ends_at) })}>Settings</Button>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Banner settings' : 'New banner'} onSave={save} loading={loading}>
        {edit && (
          <Stack spacing={2}>
            <TextField size="small" label="Internal name" value={edit.internal_name} onChange={(e) => setEdit({ ...edit, internal_name: e.target.value })} />
            <TextField select size="small" label="Placement" value={edit.placement} onChange={(e) => setEdit({ ...edit, placement: e.target.value })}>{PLACEMENTS.map((p) => <MenuItem key={p} value={p}>{humanize(p)}</MenuItem>)}</TextField>
            <TextField select size="small" label="Status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{['draft', 'published', 'archived'].map((s) => <MenuItem key={s} value={s}>{humanize(s)}</MenuItem>)}</TextField>
            <TextField size="small" label="Link" placeholder="/offers or https://…" value={edit.link_url || ''} onChange={(e) => setEdit({ ...edit, link_url: e.target.value })} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Show from" InputLabelProps={{ shrink: true }} value={edit.starts_at || ''} onChange={(e) => setEdit({ ...edit, starts_at: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Until" InputLabelProps={{ shrink: true }} value={edit.ends_at || ''} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Priority (lower first)" value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })} /></Grid>
            </Grid>
            {!edit.id && <Alert severity="info">Save, then add the images (English is required before publishing).</Alert>}
          </Stack>
        )}
      </SidebarPanel>
      {slot && <VariantEditor banner={slot.banner} slot={slot.slot} onClose={() => setSlot(null)} onSaved={() => { setSlot(null); refetch() }} />}
    </PageContainer>
  )
}

export default Banners
