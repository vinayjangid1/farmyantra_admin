/** Website content (§11): About, legal pages, buying guides and FAQs in English and Hindi. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { Plus } from 'lucide-react'

import { ConfirmDialog, CustomTable, ErrorState, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { I18nField, StatusChip, Toolbar, en } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { CONTENT_PAGES, SAVE_CONTENT_PAGE, DELETE_CONTENT_PAGE, UPLOAD_CONTENT_IMAGE } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { WEBSITE_URL } from '@/core/config/env'
import { formatRelativeTime } from '@/utils/dateFormatter'

const TYPES = { page: 'Page', legal: 'Legal', guide: 'Buying guide', faq: 'FAQ' }
const PATHS = { page: (s) => `/${s}`, legal: (s) => `/legal/${s}`, guide: (s) => `/guides/${s}`, faq: (s) => `/guides/${s}` }
const EDITABLE = ['slug', 'page_type', 'title_i18n', 'excerpt_i18n', 'body_i18n', 'cover_image_url', 'seo_title_i18n', 'seo_description_i18n', 'status', 'display_order']

const ContentPages = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:content:write')
  const { data, error, refetch } = useQuery(CONTENT_PAGES, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [type, setType] = useState('all')
  const [draft, setDraft] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const rows = (data?.contentPages || []).filter((p) => type === 'all' || p.page_type === type)
  const patch = (p) => setDraft((d) => ({ ...d, ...p }))

  const open = (p) => setDraft(p ? { id: p.id, ...Object.fromEntries(EDITABLE.map((k) => [k, p[k]])) }
    : { slug: '', page_type: 'guide', title_i18n: { en: '' }, excerpt_i18n: {}, body_i18n: { en: '' }, cover_image_url: null, seo_title_i18n: {}, seo_description_i18n: {}, status: 'draft', display_order: 0 })
  const save = async () => {
    const { id, ...input } = draft
    if (await run(SAVE_CONTENT_PAGE, { id: id || null, input: { ...input, display_order: Number(input.display_order) || 0 } })) { setDraft(null); refetch() }
  }
  const uploadCover = async (file) => {
    const res = await run(UPLOAD_CONTENT_IMAGE, { file }, { silent: true })
    if (res?.url) patch({ cover_image_url: res.url })
  }

  const columns = [
    { id: 'title_i18n', label: 'Title', minWidth: 240, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 800 }}>{en(v)}</Typography><Typography variant="caption" color="text.secondary">{PATHS[r.page_type](r.slug)}{v?.hi ? '' : ' · Hindi missing'}</Typography></> },
    { id: 'page_type', label: 'Type', format: (v) => TYPES[v] },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
    { id: 'updated_at', label: 'Updated', format: (v) => formatRelativeTime(v) },
  ]
  return (
    <PageContainer>
      <PageHeader title="Website content" subtitle="About, terms, privacy, refund policy, buying guides and FAQs" count={rows.length}
        actionLabel={canWrite ? 'New page' : undefined} actionIcon={<Plus size={18} />} onAction={canWrite ? () => open(null) : undefined} />
      <Toolbar>
        <TextField select size="small" label="Type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All types</MenuItem>
          {Object.entries(TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
      </Toolbar>
      {error ? <ErrorState message={error.message} /> : <CustomTable tableId="content" columns={columns} rows={rows} onRowClick={open} />}

      <SidebarPanel open={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? 'Edit page' : 'New page'} onSave={canWrite ? save : undefined} loading={loading}
        headerActions={draft?.id && canWrite && (
          <Stack direction="row" spacing={1}>
            {WEBSITE_URL && draft.status === 'published' && <Button size="small" href={`${WEBSITE_URL}${PATHS[draft.page_type](draft.slug)}`} target="_blank" rel="noopener">View</Button>}
            <Button size="small" color="error" onClick={() => setDeleting(draft)}>Delete</Button>
          </Stack>
        )}>
        {draft && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField select size="small" label="Type" value={draft.page_type} onChange={(e) => patch({ page_type: e.target.value })} sx={{ minWidth: 160 }}>
                {Object.entries(TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
              <TextField size="small" fullWidth label="Slug" value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} helperText={draft.slug ? `Address: ${PATHS[draft.page_type](draft.slug)}` : 'e.g. privacy-policy'} />
            </Stack>
            <I18nField label="Title" value={draft.title_i18n} onChange={(v) => patch({ title_i18n: v })} requiredEn />
            <I18nField label="Summary" value={draft.excerpt_i18n} onChange={(v) => patch({ excerpt_i18n: v })} multiline rows={2} />
            <I18nField label="Body" value={draft.body_i18n} onChange={(v) => patch({ body_i18n: v })} multiline rows={12} helperText="Plain text. Leave a blank line between paragraphs." />
            <Stack direction="row" spacing={2} alignItems="center">
              {draft.cover_image_url && <img src={mediaUrl(draft.cover_image_url)} alt="" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />}
              <Button component="label" variant="outlined" disabled={!canWrite}>{draft.cover_image_url ? 'Replace cover image' : 'Add cover image'}
                <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadCover(f) }} />
              </Button>
            </Stack>
            <I18nField label="SEO title" value={draft.seo_title_i18n} onChange={(v) => patch({ seo_title_i18n: v })} />
            <I18nField label="SEO description" value={draft.seo_description_i18n} onChange={(v) => patch({ seo_description_i18n: v })} multiline rows={2} />
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel control={<Switch checked={draft.status === 'published'} onChange={(e) => patch({ status: e.target.checked ? 'published' : 'draft' })} />} label="Published" />
              <TextField size="small" type="number" label="Sort order" value={draft.display_order} onChange={(e) => patch({ display_order: e.target.value })} sx={{ width: 120 }} />
            </Stack>
            {draft.page_type === 'legal' && <Typography variant="caption" color="text.secondary">Legal text should be reviewed by your advisor before publishing. Changes are recorded in the audit log.</Typography>}
          </Stack>
        )}
      </SidebarPanel>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={loading} title="Delete page?" message={`"${en(deleting?.title_i18n)}" will be removed from the website.`}
        onConfirm={async () => { if (await run(DELETE_CONTENT_PAGE, { id: deleting.id })) { setDeleting(null); setDraft(null); refetch() } }} />
    </PageContainer>
  )
}

export default ContentPages
