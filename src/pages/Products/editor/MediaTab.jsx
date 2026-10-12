import { useRef, useState } from 'react'
import {
  Box, Button, Card, CardActions, CardMedia, Chip, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowLeft, ArrowRight, Star, Trash2, Upload, FileText, Box as BoxIcon, Youtube } from 'lucide-react'

import { useAction } from '@/shared/hooks/useAction'
import { en, humanize } from '@/shared/components/fy'
import {
  ADD_MEDIA, UPDATE_MEDIA, REORDER_MEDIA, DELETE_MEDIA, ADD_DOCUMENT, DELETE_DOCUMENT, UPLOAD_3D, UPDATE_3D, REMOVE_3D, UPDATE_PRODUCT,
} from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { Section } from './shared'

const DOC_TYPES = ['brochure', 'manual', 'safety', 'warranty', 'spec_sheet', 'other']

const FilePick = ({ accept, label, onFile, disabled, icon = <Upload size={16} /> }) => {
  const ref = useRef(null)
  return (
    <>
      <input ref={ref} type="file" hidden accept={accept} onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = '' }} />
      <Button variant="outlined" startIcon={icon} disabled={disabled} onClick={() => ref.current?.click()}>{label}</Button>
    </>
  )
}

const MediaGallery = ({ product, refetch, canWrite }) => {
  const { run, loading } = useAction()
  const [embed, setEmbed] = useState('')
  const media = product.media
  const add = async (vars, success) => { if (await run(ADD_MEDIA, { productId: product.id, ...vars }, { success })) refetch() }
  const reorder = async (index, d) => {
    const ids = media.map((m) => m.id)
    const [id] = ids.splice(index, 1)
    ids.splice(index + d, 0, id)
    if (await run(REORDER_MEDIA, { productId: product.id, orderedIds: ids }, { silent: true })) refetch()
  }
  return (
    <Section
      title="Gallery" subtitle="Images are converted to WebP with thumbnails. The ★ image is used on cards, quotations and catalogues."
      action={canWrite && (
        <Stack direction="row" spacing={1}>
          <FilePick accept="image/jpeg,image/png,image/webp" label="Image" disabled={loading} onFile={(file) => add({ mediaType: 'image', file }, 'Image uploaded')} />
          <FilePick accept="video/mp4,video/webm" label="Video" disabled={loading} onFile={(file) => add({ mediaType: 'video', file }, 'Video uploaded')} />
        </Stack>
      )}
    >
      {canWrite && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" fullWidth label="YouTube / Vimeo link" value={embed} onChange={(e) => setEmbed(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          <Button startIcon={<Youtube size={16} />} disabled={!embed || loading} onClick={async () => { await add({ mediaType: 'video_embed', embedUrl: embed }, 'Video linked'); setEmbed('') }}>Add</Button>
        </Stack>
      )}
      {media.length === 0 && <Typography variant="body2" color="text.secondary">No media yet. At least one image is needed to publish.</Typography>}
      <Grid container spacing={2}>
        {media.map((m, i) => (
          <Grid item xs={12} sm={6} md={3} key={m.id}>
            <Card variant="outlined" sx={{ opacity: m.is_published ? 1 : 0.55 }}>
              {m.media_type === 'image' ? (
                <CardMedia component="img" height="150" image={mediaUrl(m.thumbnail_url || m.url)} alt={en(m.alt_i18n)} sx={{ objectFit: 'contain', bgcolor: 'grey.50' }} />
              ) : (
                <Box sx={{ height: 150, display: 'grid', placeItems: 'center', bgcolor: 'grey.100' }}>
                  <Chip label={m.media_type === 'video_embed' ? 'Embedded video' : 'Video'} />
                </Box>
              )}
              <Box sx={{ px: 1.5, pt: 1 }}>
                <TextField
                  size="small" fullWidth label="Alt text (EN)" defaultValue={en(m.alt_i18n)} disabled={!canWrite}
                  onBlur={async (e) => { if (e.target.value !== en(m.alt_i18n)) await run(UPDATE_MEDIA, { id: m.id, input: { alt_i18n: { ...m.alt_i18n, en: e.target.value } } }, { success: 'Alt text saved' }) }}
                />
                {product.colours.length > 0 && (
                  <TextField select size="small" fullWidth label="Shown for colour" sx={{ mt: 1 }} value={m.colour_id || ''} disabled={!canWrite}
                    onChange={async (e) => { if (await run(UPDATE_MEDIA, { id: m.id, input: { colour_id: e.target.value || null } }, { silent: true })) refetch() }}>
                    <MenuItem value="">All colours</MenuItem>
                    {product.colours.map((c) => <MenuItem key={c.id} value={c.id}>{en(c.name_i18n)}</MenuItem>)}
                  </TextField>
                )}
              </Box>
              {canWrite && (
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <IconButton size="small" disabled={i === 0 || loading} onClick={() => reorder(i, -1)} aria-label="Move left"><ArrowLeft size={16} /></IconButton>
                    <IconButton size="small" disabled={i === media.length - 1 || loading} onClick={() => reorder(i, 1)} aria-label="Move right"><ArrowRight size={16} /></IconButton>
                  </Box>
                  <Box>
                    {m.media_type === 'image' && (
                      <Tooltip title={m.is_primary ? 'Primary image' : 'Make primary'}>
                        <IconButton size="small" color={m.is_primary ? 'warning' : 'default'} onClick={async () => { if (await run(UPDATE_MEDIA, { id: m.id, input: { is_primary: true } }, { silent: true })) refetch() }}>
                          <Star size={16} fill={m.is_primary ? 'currentColor' : 'none'} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={m.is_published ? 'Hide' : 'Show'}>
                      <Switch size="small" checked={m.is_published} onChange={async (e) => { if (await run(UPDATE_MEDIA, { id: m.id, input: { is_published: e.target.checked } }, { silent: true })) refetch() }} />
                    </Tooltip>
                    <IconButton size="small" color="error" onClick={async () => { if (await run(DELETE_MEDIA, { id: m.id }, { success: 'Media deleted' })) refetch() }} aria-label="Delete"><Trash2 size={16} /></IconButton>
                  </Box>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Section>
  )
}

const Documents = ({ product, refetch, canWrite }) => {
  const { run, loading } = useAction()
  const [doc, setDoc] = useState({ docType: 'brochure', title: '', language: 'en', isPublic: true })
  return (
    <Section title="Documents" subtitle="Brochures, manuals, safety sheets (PDF). Public documents are downloadable on the product page.">
      {product.documents.map((d) => (
        <Stack key={d.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
          <FileText size={18} />
          <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
            <a href={mediaUrl(d.url)} target="_blank" rel="noopener noreferrer">{en(d.title_i18n)}</a>
          </Typography>
          <Chip size="small" label={humanize(d.doc_type)} />
          <Chip size="small" label={(d.language || 'en').toUpperCase()} variant="outlined" />
          {!d.is_public && <Chip size="small" label="Staff only" color="warning" />}
          {canWrite && <IconButton size="small" color="error" onClick={async () => { if (await run(DELETE_DOCUMENT, { id: d.id }, { success: 'Document removed' })) refetch() }}><Trash2 size={16} /></IconButton>}
        </Stack>
      ))}
      {canWrite && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }} alignItems={{ md: 'center' }}>
          <TextField size="small" label="Title (English)" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} sx={{ minWidth: 220 }} />
          <TextField select size="small" label="Type" value={doc.docType} onChange={(e) => setDoc({ ...doc, docType: e.target.value })} sx={{ minWidth: 140 }}>
            {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{humanize(t)}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Language" value={doc.language} onChange={(e) => setDoc({ ...doc, language: e.target.value })} sx={{ minWidth: 110 }}>
            <MenuItem value="en">English</MenuItem><MenuItem value="hi">Hindi</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch checked={doc.isPublic} onChange={(e) => setDoc({ ...doc, isPublic: e.target.checked })} />} label="Public" />
          <FilePick
            accept="application/pdf" label="Upload PDF" disabled={loading || !doc.title.trim()}
            onFile={async (file) => {
              const ok = await run(ADD_DOCUMENT, { productId: product.id, file, docType: doc.docType, title: { en: doc.title }, language: doc.language, isPublic: doc.isPublic }, { success: 'Document uploaded' })
              if (ok) { setDoc({ ...doc, title: '' }); refetch() }
            }}
          />
        </Stack>
      )}
    </Section>
  )
}

const Model3D = ({ product, refetch, canWrite }) => {
  const { run, loading } = useAction()
  const model = product.model_3d
  const [settings, setSettings] = useState({
    camera_orbit: model?.camera_orbit || '', min_camera_orbit: model?.min_camera_orbit || '', max_camera_orbit: model?.max_camera_orbit || '', exposure: model?.exposure ?? '',
  })
  const clean = () => ({ ...settings, exposure: settings.exposure === '' ? null : Number(settings.exposure) })
  return (
    <Section title="3D / 360° model" subtitle="GLB file up to 30 MB. The website lazy-loads it and falls back to the image gallery on slow devices.">
      {model ? (
        <Stack spacing={2}>
          <Typography variant="body2"><BoxIcon size={16} /> <a href={mediaUrl(model.url)} target="_blank" rel="noopener noreferrer">Current model</a> · {Math.round((model.file_size_bytes || 0) / 1024)} KB</Typography>
          <FormControlLabel
            control={<Switch checked={product.viewer_3d_enabled} disabled={!canWrite} onChange={async (e) => { if (await run(UPDATE_PRODUCT, { id: product.id, input: { viewer_3d_enabled: e.target.checked } }, { silent: true })) refetch() }} />}
            label="Show the 3D viewer on the website"
          />
          <Grid container spacing={2}>
            {[['camera_orbit', 'Camera orbit', '45deg 75deg 2.5m'], ['min_camera_orbit', 'Min orbit', 'auto auto 1m'], ['max_camera_orbit', 'Max orbit', 'auto auto 6m'], ['exposure', 'Exposure', '1.0']].map(([k, label, ph]) => (
              <Grid item xs={6} md={3} key={k}>
                <TextField fullWidth size="small" label={label} placeholder={ph} value={settings[k]} disabled={!canWrite} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
              </Grid>
            ))}
          </Grid>
          {canWrite && (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" disabled={loading} onClick={async () => { if (await run(UPDATE_3D, { productId: product.id, settings: clean() }, { success: 'Viewer settings saved' })) refetch() }}>Save viewer settings</Button>
              <FilePick accept=".glb,model/gltf-binary" label="Replace model" disabled={loading} onFile={async (file) => { if (await run(UPLOAD_3D, { productId: product.id, file, settings: clean() })) refetch() }} />
              <Button color="error" disabled={loading} onClick={async () => { if (await run(REMOVE_3D, { productId: product.id })) refetch() }}>Remove</Button>
            </Stack>
          )}
        </Stack>
      ) : canWrite ? (
        <FilePick accept=".glb,model/gltf-binary" label="Upload GLB model" disabled={loading}
          onFile={async (file) => { if (await run(UPLOAD_3D, { productId: product.id, file }, { success: '3D model uploaded' })) refetch() }} />
      ) : <Typography variant="body2" color="text.secondary">No 3D model.</Typography>}
    </Section>
  )
}

const MediaTab = (props) => (
  <>
    <MediaGallery {...props} />
    <Documents {...props} />
    <Model3D {...props} />
  </>
)

export default MediaTab
