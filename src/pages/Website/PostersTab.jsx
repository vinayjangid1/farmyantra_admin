/**
 * Sliders & posters: pick a position on the website, then add posters to it.
 * Each poster has its picture (upload or built-in illustration) per language
 * and device, the headline / sub-headline / button text, the link, where the
 * text sits, colours, schedule and order.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Alert, Box, Button, ButtonGroup, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, MenuItem, Slider, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import { AlignCenter, AlignLeft, AlignRight, Copy, Pencil, Eye, EyeOff, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog, SidebarPanel } from '@/shared/components'
import { StatusChip } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { BANNERS, SAVE_BANNER, SAVE_BANNER_VARIANT, DELETE_BANNER_VARIANT, DELETE_BANNER } from '@/services/admin.api'
import PosterPreview from './PosterPreview'
import { BUILT_IN_ART, PLACEMENTS, SWATCHES, placementMeta, posterImageUrl } from './posterMeta'

const SLOTS = [['en', 'desktop'], ['en', 'mobile'], ['hi', 'desktop'], ['hi', 'mobile']]
const dt = (v) => (v ? String(v).slice(0, 16) : '')
const emptyBanner = (placement) => ({
  internal_name: '', placement, status: 'draft', priority: 100, link_url: '', text_position: 'left', text_theme: 'light', bg_color: '', image_fit: 'cover', open_new_tab: false,
})

/* ── Picture + text for one language × device ── */
const VariantEditor = ({ banner, slot, onClose, onSaved }) => {
  const { run, loading } = useAction()
  const meta = placementMeta(banner.placement)
  const existing = banner.variants.find((v) => v.language === slot[0] && v.device === slot[1])
  const english = banner.variants.find((v) => v.language === 'en' && v.device === slot[1]) || banner.variants.find((v) => v.language === 'en')
  const [form, setForm] = useState(existing || {
    headline: english?.headline || '', subheadline: english?.subheadline || '', cta_label: english?.cta_label || '',
    alt_text: english?.alt_text || '', licence_note: english?.licence_note || '', focal_x: 0.5, focal_y: 0.5,
  })
  const [image, setImage] = useState(null)
  const [art, setArt] = useState(existing?.image_url?.startsWith('/graphics/') ? existing.image_url.slice(10, -4) : '')
  const [source, setSource] = useState(existing?.image_url?.startsWith('/graphics/') ? 'art' : 'upload')
  const previewSrc = image ? URL.createObjectURL(image) : source === 'art' && art ? posterImageUrl(`/graphics/${art}.svg`) : null
  const save = async () => {
    const input = { ...form, language: slot[0], device: slot[1], ...(source === 'art' && art && !image ? { builtin_art: art } : {}) }
    if (await run(SAVE_BANNER_VARIANT, { bannerId: banner.id, image: source === 'upload' ? image : null, input })) onSaved()
  }
  return (
    <SidebarPanel open onClose={onClose} title={`${slot[0] === 'en' ? 'English' : 'हिंदी'} · ${slot[1] === 'desktop' ? 'Computer' : 'Phone'}`} loading={loading} onSave={save}>
      <Stack spacing={2}>
        <PosterPreview banner={banner} variant={{ ...existing, ...form }} imageOverride={previewSrc} ratio={meta.ratio[slot[1]]} />
        <Tabs value={source} onChange={(_e, v) => setSource(v)}>
          <Tab value="upload" label="Upload a picture" />
          <Tab value="art" label="Use a built-in illustration" />
        </Tabs>
        {source === 'upload' ? (
          <>
            <Alert severity="info">Best size here: {meta[slot[1]]}. Keep words out of the picture — add them below so they stay sharp and translate.</Alert>
            <Button component="label" variant="outlined" startIcon={<ImageIcon size={16} />}>
              {image ? image.name : existing && !existing.image_url?.startsWith('/graphics/') ? 'Replace picture' : 'Choose picture'}
              <input hidden type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="caption" color="text.secondary">Focus point — the part that stays visible when the picture is cropped on smaller screens</Typography>
            <Stack direction="row" spacing={2}>
              <Slider size="small" value={form.focal_x} min={0} max={1} step={0.05} onChange={(_e, v) => setForm({ ...form, focal_x: v })} aria-label="Focus left–right" />
              <Slider size="small" value={form.focal_y} min={0} max={1} step={0.05} onChange={(_e, v) => setForm({ ...form, focal_y: v })} aria-label="Focus top–bottom" />
            </Stack>
          </>
        ) : (
          <Grid container spacing={1}>
            {BUILT_IN_ART.map(([key, label]) => (
              <Grid item xs={4} sm={3} key={key}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setArt(key)}
                  onKeyDown={(e) => e.key === 'Enter' && setArt(key)}
                  sx={{ p: 1, borderRadius: 2, cursor: 'pointer', textAlign: 'center', border: 2, borderColor: art === key ? 'primary.main' : 'divider', bgcolor: art === key ? 'primary.50' : 'background.paper' }}
                >
                  <Box component="img" src={posterImageUrl(`/graphics/${key}.svg`)} alt="" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'contain' }} />
                  <Typography variant="caption">{label}</Typography>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12}><Alert severity="info">Tip: in the poster settings set “Picture fit” to <strong>Fit inside</strong> and pick a background colour.</Alert></Grid>
          </Grid>
        )}
        <TextField size="small" label="Headline" value={form.headline || ''} onChange={(e) => setForm({ ...form, headline: e.target.value })} inputProps={{ maxLength: 160 }} />
        <TextField size="small" label="Sub-headline" multiline minRows={2} value={form.subheadline || ''} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} inputProps={{ maxLength: 240 }} />
        <TextField size="small" label="Button text" placeholder="Shop now" value={form.cta_label || ''} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} helperText="Leave empty for no button. The button opens the poster's link." inputProps={{ maxLength: 60 }} />
        <TextField size="small" required={source === 'upload'} label="Describe the picture (for screen readers)" value={form.alt_text || ''} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
        {source === 'upload' && <TextField size="small" required label="Picture source & licence" placeholder="Own photo, workshop, Oct 2026" value={form.licence_note || ''} onChange={(e) => setForm({ ...form, licence_note: e.target.value })} />}
        {existing && <Button color="error" onClick={async () => { if (await run(DELETE_BANNER_VARIANT, { bannerId: banner.id, language: slot[0], device: slot[1] })) onSaved() }}>Remove this version</Button>}
      </Stack>
    </SidebarPanel>
  )
}

/* ── Poster settings ── */
const SettingsPanel = ({ value, onChange, onClose, onSave, loading }) => {
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <SidebarPanel open onClose={onClose} title={value.id ? 'Poster settings' : 'New poster'} onSave={onSave} loading={loading}>
      <Stack spacing={2}>
        <PosterPreview banner={value} variant={value.variants?.find((v) => v.language === 'en' && v.device === 'desktop') || { headline: 'Your headline here', cta_label: 'Shop now' }} ratio={placementMeta(value.placement).ratio.desktop} />
        <TextField size="small" label="Name (only you see this)" placeholder="Diwali sprayer sale" value={value.internal_name} onChange={(e) => set({ internal_name: e.target.value })} />
        <TextField select size="small" label="Where to show" value={value.placement} onChange={(e) => set({ placement: e.target.value })}>
          {PLACEMENTS.map((p) => <MenuItem key={p.key} value={p.key}>{p.page} — {p.label}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Link (where the poster and button go)" placeholder="/offers, /category/sprayers or https://…" value={value.link_url || ''} onChange={(e) => set({ link_url: e.target.value })} />
        <FormControlLabel control={<Switch checked={Boolean(value.open_new_tab)} onChange={(e) => set({ open_new_tab: e.target.checked })} />} label="Open link in a new tab" />

        <Typography variant="subtitle2">Text position</Typography>
        <ButtonGroup>
          {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([pos, Icon]) => (
            <Button key={pos} variant={value.text_position === pos ? 'contained' : 'outlined'} startIcon={<Icon size={15} />} onClick={() => set({ text_position: pos })}>{pos[0].toUpperCase() + pos.slice(1)}</Button>
          ))}
        </ButtonGroup>
        <Stack direction="row" spacing={2}>
          <TextField select fullWidth size="small" label="Text colour" value={value.text_theme} onChange={(e) => set({ text_theme: e.target.value })}>
            <MenuItem value="light">White text (for dark pictures)</MenuItem>
            <MenuItem value="dark">Dark text (for light pictures)</MenuItem>
          </TextField>
          <TextField select fullWidth size="small" label="Picture fit" value={value.image_fit} onChange={(e) => set({ image_fit: e.target.value })}>
            <MenuItem value="cover">Fill the poster (photos)</MenuItem>
            <MenuItem value="contain">Fit inside on a colour (illustrations, product cut-outs)</MenuItem>
          </TextField>
        </Stack>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Background colour</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {SWATCHES.map((c) => (
              <Box key={c} role="button" tabIndex={0} aria-label={c} onClick={() => set({ bg_color: c })} onKeyDown={(e) => e.key === 'Enter' && set({ bg_color: c })}
                sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: 2, borderColor: value.bg_color === c ? 'primary.main' : 'divider', boxShadow: value.bg_color === c ? 3 : 0 }} />
            ))}
            <TextField size="small" sx={{ width: 120 }} placeholder="#2874F0" value={value.bg_color || ''} onChange={(e) => set({ bg_color: e.target.value })} />
          </Stack>
        </Box>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Show from" InputLabelProps={{ shrink: true }} value={value.starts_at || ''} onChange={(e) => set({ starts_at: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Show until" InputLabelProps={{ shrink: true }} value={value.ends_at || ''} onChange={(e) => set({ ends_at: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Order (lower shows first)" value={value.priority} onChange={(e) => set({ priority: e.target.value })} /></Grid>
          <Grid item xs={6}>
            <TextField select fullWidth size="small" label="Status" value={value.status} onChange={(e) => set({ status: e.target.value })}>
              <MenuItem value="draft">Draft (hidden)</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        {!value.id && <Alert severity="info">Save first, then add the picture and text. The English computer version is needed before publishing.</Alert>}
      </Stack>
    </SidebarPanel>
  )
}

/* ── Tab ── */
const PostersTab = ({ canWrite }) => {
  const { data, refetch, loading: listLoading } = useQuery(BANNERS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [placement, setPlacement] = useState('home_hero')
  const [edit, setEdit] = useState(null)
  const [slot, setSlot] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const all = useMemo(() => data?.banners || [], [data])
  const meta = placementMeta(placement)
  const list = all.filter((b) => b.placement === placement)
  const liveCount = (key) => all.filter((b) => b.placement === key && b.display_state === 'live').length

  const saveSettings = async () => {
    const input = { ...edit, variants: undefined, display_state: undefined, starts_at: edit.starts_at || null, ends_at: edit.ends_at || null, priority: Number(edit.priority) || 100, bg_color: edit.bg_color || null }
    const saved = await run(SAVE_BANNER, { id: edit.id || null, input })
    if (saved) {
      setPlacement(saved.placement || edit.placement)
      setEdit(null)
      refetch()
    }
  }
  const quickStatus = async (b, status) => {
    if (await run(SAVE_BANNER, { id: b.id, input: { ...b, variants: undefined, display_state: undefined, status } })) refetch()
  }
  const duplicate = async (b) => {
    const copy = await run(SAVE_BANNER, { id: null, input: { ...b, id: undefined, variants: undefined, display_state: undefined, status: 'draft', internal_name: `${b.internal_name} (copy)` } })
    if (copy) refetch()
  }

  return (
    <Grid container spacing={2.5}>
      {/* Positions */}
      <Grid item xs={12} md={4} lg={3}>
        <Card>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            {['Home', 'Shop', 'Product', 'Offers', 'Customer'].map((page) => (
              <Box key={page} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ px: 1, fontWeight: 700, color: 'text.secondary' }}>{page} page</Typography>
                {PLACEMENTS.filter((p) => p.page === page).map((p) => (
                  <Box key={p.key} role="button" tabIndex={0} onClick={() => setPlacement(p.key)} onKeyDown={(e) => e.key === 'Enter' && setPlacement(p.key)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1, mt: 0.5, borderRadius: 2, cursor: 'pointer', bgcolor: placement === p.key ? 'primary.main' : 'transparent', color: placement === p.key ? 'primary.contrastText' : 'text.primary', '&:hover': { bgcolor: placement === p.key ? 'primary.main' : 'action.hover' } }}>
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: placement === p.key ? 700 : 500 }}>{p.label}</Typography>
                    <Chip size="small" label={`${liveCount(p.key)} live`} sx={{ height: 20, fontSize: '0.65rem', bgcolor: placement === p.key ? 'rgba(255,255,255,.22)' : 'action.selected', color: 'inherit' }} />
                  </Box>
                ))}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Posters in this position */}
      <Grid item xs={12} md={8} lg={9}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{meta.page} — {meta.label}</Typography>
            <Typography variant="caption" color="text.secondary">Shows up to {meta.max} live poster{meta.max > 1 ? 's' : ''}, lowest order number first. Picture size: computer {meta.desktop}, phone {meta.mobile}.</Typography>
          </Box>
          {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setEdit(emptyBanner(placement))}>Add poster</Button>}
        </Stack>

        {!list.length && !listLoading && (
          <Alert severity="info">
            No posters here yet. {placement.startsWith('home_') ? 'The website shows its built-in designs until you publish one.' : 'Nothing is shown in this position until you publish one.'}
          </Alert>
        )}

        <Stack spacing={2}>
          {list.map((b) => {
            const desktop = b.variants.find((v) => v.language === 'en' && v.device === 'desktop') || b.variants[0]
            return (
              <Card key={b.id}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} lg={6}>
                      <PosterPreview banner={b} variant={desktop} ratio={meta.ratio.desktop} />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 800, flex: 1 }} noWrap>{b.internal_name}</Typography>
                        <StatusChip status={b.display_state} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Order {b.priority} · Text {b.text_position} · {b.link_url ? `Links to ${b.link_url}` : 'No link'}
                        {b.starts_at || b.ends_at ? ` · ${b.starts_at ? `from ${dt(b.starts_at).replace('T', ' ')}` : ''}${b.ends_at ? ` until ${dt(b.ends_at).replace('T', ' ')}` : ''}` : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>Picture & text versions</Typography>
                      <Grid container spacing={1} sx={{ mt: 0.25, mb: 1.5 }}>
                        {SLOTS.map(([lang, device]) => {
                          const v = b.variants.find((x) => x.language === lang && x.device === device)
                          return (
                            <Grid item xs={6} sm={3} key={`${lang}-${device}`}>
                              <Box role={canWrite ? 'button' : undefined} tabIndex={canWrite ? 0 : undefined} onClick={canWrite ? () => setSlot({ banner: b, slot: [lang, device] }) : undefined}
                                onKeyDown={(e) => canWrite && e.key === 'Enter' && setSlot({ banner: b, slot: [lang, device] })}
                                sx={{ cursor: canWrite ? 'pointer' : 'default', border: 1, borderStyle: v ? 'solid' : 'dashed', borderColor: v ? 'divider' : 'primary.main', borderRadius: 1.5, aspectRatio: '4 / 3', overflow: 'hidden', display: 'grid', placeItems: 'center', bgcolor: b.bg_color || 'action.hover', '&:hover': { boxShadow: 3 } }}>
                                {v ? <Box component="img" src={posterImageUrl(v.image_url)} alt={v.alt_text} sx={{ width: '100%', height: '100%', objectFit: b.image_fit === 'contain' ? 'contain' : 'cover' }} /> : <Typography variant="caption" color="primary">+ Add</Typography>}
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.25 }}>{lang === 'en' ? 'English' : 'हिंदी'} · {device === 'desktop' ? 'Computer' : 'Phone'}</Typography>
                            </Grid>
                          )
                        })}
                      </Grid>
                      {canWrite && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Button size="small" startIcon={<Pencil size={14} />} onClick={() => setEdit({ ...b, starts_at: dt(b.starts_at), ends_at: dt(b.ends_at), bg_color: b.bg_color || '' })}>Settings</Button>
                          {b.status === 'published'
                            ? <Button size="small" startIcon={<EyeOff size={14} />} onClick={() => quickStatus(b, 'draft')} disabled={loading}>Hide</Button>
                            : <Button size="small" startIcon={<Eye size={14} />} onClick={() => quickStatus(b, 'published')} disabled={loading}>Publish</Button>}
                          <Box sx={{ flex: 1 }} />
                          <Tooltip title="Duplicate"><IconButton size="small" onClick={() => duplicate(b)}><Copy size={15} /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirm(b)}><Trash2 size={15} /></IconButton></Tooltip>
                        </Stack>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Grid>

      {edit && <SettingsPanel value={edit} onChange={setEdit} onClose={() => setEdit(null)} onSave={saveSettings} loading={loading} />}
      {slot && <VariantEditor banner={slot.banner} slot={slot.slot} onClose={() => setSlot(null)} onSaved={() => { setSlot(null); refetch() }} />}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete poster?"
        message={`“${confirm?.internal_name}” and all its pictures will be removed from the website.`}
        loading={loading}
        onConfirm={async () => { if (await run(DELETE_BANNER, { id: confirm.id })) { setConfirm(null); refetch() } }}
      />
    </Grid>
  )
}

export default PostersTab
