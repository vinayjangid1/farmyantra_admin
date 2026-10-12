/** Category tree (§4.3): bilingual names, images, filters shown in the shop, ordering. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Autocomplete, Avatar, Box, Button, Chip, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { Plus } from 'lucide-react'

import { ConfirmDialog, CustomTable, ErrorState, LoadingState, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { I18nField, en } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { CATEGORIES, SAVE_CATEGORY, DELETE_CATEGORY } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'

const FILTER_KEYS = ['price', 'power_hp', 'fuel_type', 'capacity', 'weight_kg', 'availability', 'brand', 'intended_use', 'rating', 'customisable']
const EDITABLE = ['parent_id', 'slug', 'name_i18n', 'description_i18n', 'icon', 'seo_title_i18n', 'seo_description_i18n', 'filter_keys', 'is_active', 'is_featured', 'display_order']

/** Depth-first order so children follow their parent. */
const flatten = (categories) => {
  const children = new Map()
  for (const c of categories) {
    const key = c.parent_id || 'root'
    children.set(key, [...(children.get(key) || []), c])
  }
  const out = []
  const walk = (key, depth) => (children.get(key) || []).forEach((c) => { out.push({ ...c, depth }); walk(c.id, depth + 1) })
  walk('root', 0)
  // Orphans (parent deleted) still appear
  for (const c of categories) if (!out.some((o) => o.id === c.id)) out.push({ ...c, depth: 0 })
  return out
}

const Categories = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:products:write')
  const { data, loading, error, refetch } = useQuery(CATEGORIES, { fetchPolicy: 'cache-and-network' })
  const { run, loading: busy } = useAction()
  const [draft, setDraft] = useState(null)
  const [image, setImage] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const rows = flatten(data?.categories || [])

  const open = (c) => {
    setImage(null)
    setDraft(c ? Object.fromEntries([['id', c.id], ['image_url', c.image_url], ...EDITABLE.map((k) => [k, c[k] ?? (k === 'filter_keys' ? [] : '')])])
      : { parent_id: '', slug: '', name_i18n: { en: '' }, description_i18n: {}, icon: '', seo_title_i18n: {}, seo_description_i18n: {}, filter_keys: ['price', 'power_hp', 'availability'], is_active: true, is_featured: false, display_order: 0 })
  }
  const patch = (p) => setDraft((d) => ({ ...d, ...p }))
  const save = async () => {
    const { id, image_url: _img, ...rest } = draft
    const input = { ...rest, parent_id: rest.parent_id || null, slug: rest.slug || undefined, icon: rest.icon || null, display_order: Number(rest.display_order) || 0 }
    if (await run(SAVE_CATEGORY, { id: id || null, input, image })) { setDraft(null); refetch() }
  }

  const columns = [
    {
      id: 'name_i18n', label: 'Category', minWidth: 260,
      format: (v, r) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pl: r.depth * 3 }}>
          <Avatar variant="rounded" src={mediaUrl(r.image_url)} sx={{ width: 36, height: 36 }}>{en(v)[0]}</Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{r.depth ? '↳ ' : ''}{en(v)}</Typography>
            <Typography variant="caption" color="text.secondary">{v?.hi || 'Hindi missing'} · /category/{r.slug}</Typography>
          </Box>
        </Stack>
      ),
    },
    { id: 'product_count', label: 'Published products', align: 'right' },
    { id: 'filter_keys', label: 'Shop filters', format: (v) => (v || []).join(', ') || '—' },
    { id: 'is_featured', label: 'Home page', format: (v) => (v ? <Chip size="small" color="success" label="Featured" /> : '—') },
    { id: 'is_active', label: 'Visible', format: (v) => (v ? 'Yes' : <Chip size="small" label="Hidden" />) },
    { id: 'display_order', label: 'Order', align: 'right' },
  ]

  if (loading && !data) return <LoadingState />
  return (
    <PageContainer>
      <PageHeader title="Categories" subtitle="How the shop is organised. Sub-categories appear under their parent." count={rows.length}
        actionLabel={canWrite ? 'New category' : undefined} actionIcon={<Plus size={18} />} onAction={canWrite ? () => open(null) : undefined} />
      {error ? <ErrorState message={error.message} /> : (
        <CustomTable tableId="categories" columns={columns} rows={rows} onRowClick={canWrite ? open : undefined} />
      )}

      <SidebarPanel open={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? 'Edit category' : 'New category'} onSave={save} loading={busy}
        headerActions={draft?.id && <Button color="error" onClick={() => setDeleting(draft)}>Delete</Button>}>
        {draft && (
          <Stack spacing={2}>
            <I18nField label="Name" value={draft.name_i18n} onChange={(v) => patch({ name_i18n: v })} requiredEn />
            <I18nField label="Description" value={draft.description_i18n} onChange={(v) => patch({ description_i18n: v })} multiline />
            <Stack direction="row" spacing={2}>
              <TextField size="small" fullWidth label="Slug" value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} helperText="Blank = from English name" />
              <TextField select size="small" fullWidth label="Parent" value={draft.parent_id || ''} onChange={(e) => patch({ parent_id: e.target.value })}>
                <MenuItem value="">— Top level —</MenuItem>
                {rows.filter((c) => c.id !== draft.id).map((c) => <MenuItem key={c.id} value={c.id}>{'— '.repeat(c.depth)}{en(c.name_i18n)}</MenuItem>)}
              </TextField>
            </Stack>
            <Autocomplete multiple options={FILTER_KEYS} value={draft.filter_keys} onChange={(_e, v) => patch({ filter_keys: v })}
              renderInput={(params) => <TextField {...params} size="small" label="Filters shown in the shop" />} />
            <Stack direction="row" spacing={2}>
              <TextField size="small" label="Icon (optional)" value={draft.icon || ''} onChange={(e) => patch({ icon: e.target.value })} helperText="e.g. tractor" />
              <TextField size="small" type="number" label="Sort order" value={draft.display_order} onChange={(e) => patch({ display_order: e.target.value })} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              {(image || draft.image_url) && <Avatar variant="rounded" src={image ? URL.createObjectURL(image) : mediaUrl(draft.image_url)} sx={{ width: 64, height: 64 }} />}
              <Button component="label" variant="outlined">{draft.image_url || image ? 'Replace image' : 'Upload image'}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </Button>
            </Stack>
            <I18nField label="SEO title" value={draft.seo_title_i18n} onChange={(v) => patch({ seo_title_i18n: v })} />
            <I18nField label="SEO description" value={draft.seo_description_i18n} onChange={(v) => patch({ seo_description_i18n: v })} multiline rows={2} />
            <FormControlLabel control={<Switch checked={draft.is_active} onChange={(e) => patch({ is_active: e.target.checked })} />} label="Visible on the website" />
            <FormControlLabel control={<Switch checked={draft.is_featured} onChange={(e) => patch({ is_featured: e.target.checked })} />} label="Featured on the home page" />
          </Stack>
        )}
      </SidebarPanel>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={busy} title="Delete category?"
        message="Only empty categories can be deleted. Move or archive its products first."
        onConfirm={async () => { if (await run(DELETE_CATEGORY, { id: deleting.id })) { setDeleting(null); setDraft(null); refetch() } }} />
    </PageContainer>
  )
}

export default Categories
