/**
 * Trust content (§29): live numbers from real orders (or documented
 * overrides), certifications with attestation, and delivery photos that
 * customers agreed to share.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Grid, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'

import { CustomTable, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { I18nField, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import {
  TRUST_STATS, SAVE_TRUST_OVERRIDE, REFRESH_TRUST_STATS, CERTIFICATIONS, SAVE_CERTIFICATION, CONSENTED_DELIVERIES, DELIVERY_PHOTOS, ADD_DELIVERY_PHOTO, SET_DELIVERY_PHOTO_PUBLISHED,
} from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { en } from '@/features/fulfilment/utils'
import { formatDate } from '@/utils/dateFormatter'

const Numbers = ({ canWrite }) => {
  const { data, refetch } = useQuery(TRUST_STATS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const t = data?.trustStats
  if (!t) return null
  const tiles = [['happy_customers', t.snapshot?.happy_customers], ['machines_delivered', t.snapshot?.machines_delivered]]
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Calculated nightly from delivered orders. Last: {t.snapshot ? formatDate(t.snapshot.computed_at, 'long') : 'never'}</Typography>
        {canWrite && <Button size="small" variant="outlined" disabled={loading} onClick={async () => { if (await run(REFRESH_TRUST_STATS)) refetch() }}>Recalculate now</Button>}
      </Stack>
      <Grid container spacing={2}>
        {tiles.map(([key, computed]) => {
          const ov = t.overrides?.[key]
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card variant="outlined"><CardContent>
                <Typography variant="caption" color="text.secondary">{humanize(key)}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>{ov ? ov.value : computed ?? 0}</Typography>
                <Typography variant="caption" color="text.secondary">{ov ? `Override as of ${ov.as_of} — ${ov.note}` : `From orders (${computed ?? 0})`}</Typography>
                {canWrite && <Box><Button size="small" onClick={() => setEdit({ key, value: ov?.value ?? '', asOf: ov?.as_of || new Date().toISOString().slice(0, 10), note: ov?.note || '' })}>{ov ? 'Change override' : 'Override'}</Button></Box>}
              </CardContent></Card>
            </Grid>
          )
        })}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">States served</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{t.snapshot?.states_served?.length || 0}</Typography>
            <Typography variant="caption" color="text.secondary">{(t.snapshot?.states_served || []).join(', ') || '—'}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mt: 2 }}>Numbers are never shown when zero. An override needs a date and a note explaining the source (e.g. sales before the website).</Alert>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit ? `Override ${humanize(edit.key)}` : ''} loading={loading}
        onSave={async () => { if (await run(SAVE_TRUST_OVERRIDE, { key: edit.key, value: edit.value === '' ? null : Number(edit.value), asOf: edit.asOf, note: edit.note })) { setEdit(null); refetch() } }}>
        {edit && (
          <Stack spacing={2}>
            <TextField size="small" type="number" label="Value (empty = use calculated)" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} />
            <TextField size="small" type="date" label="As of" InputLabelProps={{ shrink: true }} value={edit.asOf} onChange={(e) => setEdit({ ...edit, asOf: e.target.value })} />
            <TextField size="small" multiline minRows={2} label="Source of this number" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} />
          </Stack>
        )}
      </SidebarPanel>
    </Box>
  )
}

const Certifications = ({ canWrite }) => {
  const { data, refetch } = useQuery(CERTIFICATIONS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const [files, setFiles] = useState({})
  return (
    <Box>
      {canWrite && <Button variant="contained" sx={{ mb: 2 }} onClick={() => { setFiles({}); setEdit({ name_i18n: { en: '' }, issuer: '', is_published: false }) }}>Add certification</Button>}
      <CustomTable tableId="certifications" rows={data?.certifications || []} onRowClick={canWrite ? (r) => { setFiles({}); setEdit({ ...r, valid_from: r.valid_from || '', valid_to: r.valid_to || '' }) } : undefined} columns={[
        { id: 'name_i18n', label: 'Certification', format: (v) => en(v) },
        { id: 'issuer', label: 'Issuer' },
        { id: 'certificate_number', label: 'Number' },
        { id: 'valid_to', label: 'Valid until', format: (v) => v || '—' },
        { id: 'is_published', label: 'On website', format: (v) => (v ? 'Yes' : 'No') },
      ]} />
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Edit certification' : 'New certification'} loading={loading}
        onSave={async () => { if (await run(SAVE_CERTIFICATION, { id: edit.id || null, input: edit, document: files.document || null, logo: files.logo || null })) { setEdit(null); refetch() } }}>
        {edit && (
          <Stack spacing={2}>
            <I18nField label="Name" value={edit.name_i18n} onChange={(v) => setEdit({ ...edit, name_i18n: v })} requiredEn />
            <TextField size="small" label="Issuer" value={edit.issuer} onChange={(e) => setEdit({ ...edit, issuer: e.target.value })} />
            <TextField size="small" label="Certificate number" value={edit.certificate_number || ''} onChange={(e) => setEdit({ ...edit, certificate_number: e.target.value })} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Valid from" InputLabelProps={{ shrink: true }} value={edit.valid_from || ''} onChange={(e) => setEdit({ ...edit, valid_from: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Valid until" InputLabelProps={{ shrink: true }} value={edit.valid_to || ''} onChange={(e) => setEdit({ ...edit, valid_to: e.target.value })} /></Grid>
            </Grid>
            <Stack direction="row" spacing={1}>
              <Button component="label" size="small" variant="outlined">{files.document?.name || 'Certificate PDF'}<input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setFiles({ ...files, document: e.target.files?.[0] })} /></Button>
              <Button component="label" size="small" variant="outlined">{files.logo?.name || 'Logo'}<input hidden type="file" accept="image/*" onChange={(e) => setFiles({ ...files, logo: e.target.files?.[0] })} /></Button>
            </Stack>
            <FormControlLabel control={<Switch checked={Boolean(edit.is_published)} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} />} label="Show on the website" />
            {edit.is_published && <FormControlLabel control={<Checkbox checked={Boolean(edit.attest)} onChange={(e) => setEdit({ ...edit, attest: e.target.checked })} />} label="I confirm this certification is genuine and current" />}
          </Stack>
        )}
      </SidebarPanel>
    </Box>
  )
}

const DeliveryPhotos = ({ canWrite }) => {
  const { data: consented, refetch: r1 } = useQuery(CONSENTED_DELIVERIES, { fetchPolicy: 'cache-and-network' })
  const { data: photos, refetch: r2 } = useQuery(DELIVERY_PHOTOS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [add, setAdd] = useState(null)
  const [image, setImage] = useState(null)
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Customers who agreed to a photo</Typography>
        {(consented?.consentedDeliveries || []).map((d) => (
          <Stack key={d.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ flex: 1 }}>{d.order_number} · {d.customer_name} · {d.city} · {d.photo_count} photo(s)</Typography>
            {canWrite && <Button size="small" onClick={() => { setImage(null); setAdd({ confirmationId: d.id, customer_display_name: d.customer_name.split(' ')[0], district: d.city, caption_i18n: { en: '' }, is_published: false }) }}>Add photo</Button>}
          </Stack>
        ))}
      </Grid>
      <Grid item xs={12} md={7}>
        <Grid container spacing={1.5}>
          {(photos?.deliveryPhotos || []).map((p) => (
            <Grid item xs={6} sm={4} key={p.id}>
              <Card variant="outlined">
                <Box component="img" src={mediaUrl(p.image_url)} alt={en(p.caption_i18n)} sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }} />
                <CardContent sx={{ p: 1, pb: '8px !important' }}>
                  <Typography variant="caption">{p.customer_display_name}{p.district ? `, ${p.district}` : ''}</Typography>
                  {canWrite && <FormControlLabel control={<Switch size="small" checked={p.is_published} onChange={async (e) => { if (await run(SET_DELIVERY_PHOTO_PUBLISHED, { id: p.id, published: e.target.checked })) r2() }} />} label="Show" />}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
      <SidebarPanel open={Boolean(add)} onClose={() => setAdd(null)} title="Add delivery photo" loading={loading}
        onSave={async () => { if (await run(ADD_DELIVERY_PHOTO, { confirmationId: add.confirmationId, image, input: add })) { setAdd(null); r1(); r2() } }}>
        {add && (
          <Stack spacing={2}>
            <Button component="label" variant="outlined">{image?.name || 'Choose photo'}<input hidden type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} /></Button>
            <TextField size="small" label="Name shown" value={add.customer_display_name} onChange={(e) => setAdd({ ...add, customer_display_name: e.target.value })} helperText="First name only is recommended" />
            <TextField size="small" label="District" value={add.district} onChange={(e) => setAdd({ ...add, district: e.target.value })} />
            <I18nField label="Caption" value={add.caption_i18n} onChange={(v) => setAdd({ ...add, caption_i18n: v })} />
            <FormControlLabel control={<Switch checked={add.is_published} onChange={(e) => setAdd({ ...add, is_published: e.target.checked })} />} label="Show on the website now" />
          </Stack>
        )}
      </SidebarPanel>
    </Grid>
  )
}

const TrustContent = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:content:write')
  const [tab, setTab] = useState('numbers')
  return (
    <PageContainer>
      <PageHeader title="Trust & proof" subtitle="Real numbers, certifications and delivery photos for the website. Nothing invented." />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
        <Tab value="numbers" label="Numbers" />
        <Tab value="certifications" label="Certifications" />
        <Tab value="photos" label="Delivery photos" />
      </Tabs>
      {tab === 'numbers' && <Numbers canWrite={canWrite} />}
      {tab === 'certifications' && <Certifications canWrite={canWrite} />}
      {tab === 'photos' && <DeliveryPhotos canWrite={canWrite} />}
    </PageContainer>
  )
}

export default TrustContent
