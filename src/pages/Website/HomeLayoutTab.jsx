/**
 * Home page layout: switch sections on/off, move them up/down, rename their
 * titles, and edit the hero text, videos and the "in business since" year.
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material'
import { ArrowDown, ArrowUp, RotateCcw, Save } from 'lucide-react'

import { I18nField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { HOME_CONTENT, SAVE_HOME_CONTENT } from '@/services/admin.api'

const SECTIONS = {
  categories: ['Category picture strip', 'Round icons for every category, with dropdowns'],
  hero: ['Main slider', 'Posters from “Main slider” — built-in slides until you add some'],
  promise: ['Promise strip', 'Configure · call-back · quotation · delivery'],
  deals: ['Top machines row', 'Featured products, scrolls sideways'],
  grids: ['Three product grids', 'Featured, just arrived, build your own'],
  promo: ['Promo tiles', 'Posters from “3 promo tiles”'],
  strip: ['Wide strip poster', 'Posters from “Wide strip”'],
  offers: ['Offers for you', 'Live offers and coupons'],
  new: ['New arrivals row', 'Newest products'],
  middle: ['Two middle posters', 'Posters from “2 posters side by side”'],
  partners: ['Trusted partners', 'Scrolling logo strip'],
  stats: ['Years & numbers band', 'Years in business, customers, machines, states'],
  how: ['How buying works', '3 steps and your benefits'],
  stories: ['Farmer stories', 'Customer photos and quotes'],
  video: ['Video', 'Demo video below'],
  trust: ['Certifications & deliveries', 'Certificates, delivery photos, visit us'],
  reviews: ['Verified reviews', 'Featured reviews from buyers'],
  bottom: ['Two bottom posters', 'Posters from “2 posters (near the bottom)”'],
  recent: ['Recently viewed', 'Only shows for returning visitors'],
}
const DEFAULT_ORDER = Object.keys(SECTIONS)

const HomeLayoutTab = ({ canWrite }) => {
  const { data } = useQuery(HOME_CONTENT, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!data?.homeContent || form) return
    const h = data.homeContent
    const saved = (h.layout || []).filter((x) => SECTIONS[x.key])
    const missing = DEFAULT_ORDER.filter((k) => !saved.some((x) => x.key === k)).map((key) => ({ key, visible: true }))
    setForm({ ...h, layout: [...saved, ...missing], titles: h.titles || {} })
  }, [data, form])

  if (!form) return null
  const move = (i, dir) => {
    const layout = [...form.layout]
    const j = i + dir
    if (j < 0 || j >= layout.length) return
    ;[layout[i], layout[j]] = [layout[j], layout[i]]
    setForm({ ...form, layout })
  }
  const toggle = (i) => setForm({ ...form, layout: form.layout.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)) })
  const setTitle = (key, value) => setForm({ ...form, titles: { ...form.titles, [key]: value } })
  const save = () => run(SAVE_HOME_CONTENT, {
    value: {
      layout: form.layout, titles: form.titles, hero_title_i18n: form.hero_title_i18n, hero_subtitle_i18n: form.hero_subtitle_i18n,
      hero_image_url: form.hero_image_url || null, hero_video_url: form.hero_video_url || null, demo_video_url: form.demo_video_url || null,
      established_year: form.established_year || null,
    },
  })

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} lg={7}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>Home page sections</Typography>
              <Tooltip title="Back to the default order"><span><IconButton disabled={!canWrite} onClick={() => setForm({ ...form, layout: DEFAULT_ORDER.map((key) => ({ key, visible: true })) })}><RotateCcw size={16} /></IconButton></span></Tooltip>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Top to bottom, as on the website. Rename a title or leave it empty to use the default.</Typography>
            <Stack spacing={1}>
              {form.layout.map((item, i) => {
                const [label, hint] = SECTIONS[item.key]
                return (
                  <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2.5, border: 1, borderColor: 'divider', opacity: item.visible ? 1 : 0.55, bgcolor: 'background.paper' }}>
                    <Typography sx={{ width: 26, textAlign: 'center', fontWeight: 800, color: 'text.disabled' }}>{i + 1}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{hint}</Typography>
                      {['deals', 'grids', 'offers', 'new', 'partners', 'stats', 'how', 'stories', 'video', 'reviews'].includes(item.key) && (
                        <TextField size="small" fullWidth variant="standard" placeholder="Custom title (optional)" value={form.titles[item.key] || ''} onChange={(e) => setTitle(item.key, e.target.value)} disabled={!canWrite} sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                    <IconButton size="small" aria-label="Move up" disabled={!canWrite || i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></IconButton>
                    <IconButton size="small" aria-label="Move down" disabled={!canWrite || i === form.layout.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></IconButton>
                    <Switch checked={item.visible} onChange={() => toggle(i)} disabled={!canWrite} inputProps={{ 'aria-label': `Show ${label}` }} />
                  </Box>
                )
              })}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Stack spacing={2.5} sx={{ position: { lg: 'sticky' }, top: { lg: 0 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Business details shown</Typography>
              <TextField fullWidth size="small" type="number" label="In business since (year)" placeholder="2004" value={form.established_year || ''} onChange={(e) => setForm({ ...form, established_year: e.target.value })} disabled={!canWrite} helperText="Shows as “20+ years in farm machinery” on the home page." />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Videos & default text</Typography>
              <Stack spacing={2}>
                <I18nField label="Site headline" value={form.hero_title_i18n} onChange={(v) => setForm({ ...form, hero_title_i18n: v })} />
                <I18nField label="Site description" multiline rows={2} value={form.hero_subtitle_i18n} onChange={(v) => setForm({ ...form, hero_subtitle_i18n: v })} />
                <TextField size="small" label="Video (YouTube or .mp4 link)" placeholder="https://www.youtube.com/watch?v=…" value={form.demo_video_url || ''} onChange={(e) => setForm({ ...form, demo_video_url: e.target.value })} disabled={!canWrite} />
                <TextField size="small" label="Video cover picture link (optional)" value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} disabled={!canWrite} />
              </Stack>
            </CardContent>
          </Card>
          {canWrite && <Button size="large" variant="contained" startIcon={<Save size={16} />} disabled={loading} onClick={save}>Save home page</Button>}
          <Alert severity="info">Changes show on the website within about a minute.</Alert>
        </Stack>
      </Grid>
    </Grid>
  )
}

export default HomeLayoutTab
