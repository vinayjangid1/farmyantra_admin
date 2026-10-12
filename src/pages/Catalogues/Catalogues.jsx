/**
 * Catalogue PDFs (§11.3, §12). Each generation is an immutable dated
 * version; publishing one makes it the file behind the website's stable
 * download link for that category + language.
 */
import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Button, Card, CardContent, FormControlLabel, Grid, Link, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { FileDown, RefreshCw } from 'lucide-react'

import { ConfirmDialog, CustomTable, ErrorState, PageContainer, PageHeader } from '@/shared/components'
import { StatusChip, en } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { CATALOGUE_VERSIONS, CATEGORIES, GENERATE_CATALOGUE, REGENERATE_CATALOGUE, SET_CATALOGUE_PUBLISHED, DELETE_CATALOGUE } from '@/services/admin.api'
import { categoryOptions } from '@/utils/categories'
import { mediaUrl, publicFileUrl } from '@/services/files'
import { formatRelativeTime } from '@/utils/dateFormatter'

const Catalogues = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:catalogues:write')
  const { data, error, refetch, startPolling, stopPolling } = useQuery(CATALOGUE_VERSIONS, { fetchPolicy: 'cache-and-network' })
  const { data: catData } = useQuery(CATEGORIES)
  const { run, loading } = useAction()
  const [form, setForm] = useState({ title: 'FarmYantra Product Catalogue', categoryId: '', language: 'en', includePrices: true })
  const [deleting, setDeleting] = useState(null)
  const rows = data?.catalogueVersions || []
  const pending = rows.some((r) => ['queued', 'generating'].includes(r.status))

  // Generation runs in the background on the server; poll while any job is open.
  useEffect(() => {
    if (pending) startPolling(3000)
    else stopPolling()
    return () => stopPolling()
  }, [pending, startPolling, stopPolling])

  const generate = async () => {
    if (await run(GENERATE_CATALOGUE, { ...form, categoryId: form.categoryId || null }, { success: 'Generating — this takes a few seconds' })) refetch()
  }
  const categoryName = (id) => (id ? en(catData?.categories?.find((c) => c.id === id)?.name_i18n) : 'All products')

  const columns = [
    { id: 'title', label: 'Catalogue', minWidth: 220, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.version_label} · {categoryName(r.category_id)} · {r.language === 'hi' ? 'हिंदी' : 'English'}{r.include_prices ? '' : ' · no prices'}</Typography></> },
    { id: 'status', label: 'Status', format: (v, r) => <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={v} />{r.is_published && <StatusChip status="published" label="Live" />}</Stack> },
    { id: 'product_count', label: 'Products', align: 'right' },
    { id: 'file_size_bytes', label: 'Size', align: 'right', format: (v) => (v ? `${(v / 1024 / 1024).toFixed(1)} MB` : '—') },
    { id: 'download_count', label: 'Downloads', align: 'right' },
    { id: 'created_at', label: 'Generated', format: (v, r) => <>{formatRelativeTime(r.generated_at || v)}<Typography variant="caption" display="block" color="text.secondary">{r.requested_by_name}</Typography></> },
    {
      id: 'actions', label: '', align: 'right', minWidth: 260,
      format: (_v, r) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          {r.file_url && <Button size="small" startIcon={<FileDown size={14} />} href={mediaUrl(r.file_url)} target="_blank" rel="noopener">Open</Button>}
          {canWrite && r.status === 'ready' && (
            <Button size="small" color={r.is_published ? 'warning' : 'success'} disabled={loading}
              onClick={async () => { if (await run(SET_CATALOGUE_PUBLISHED, { id: r.id, published: !r.is_published })) refetch() }}>
              {r.is_published ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          {canWrite && <Button size="small" startIcon={<RefreshCw size={14} />} disabled={loading} onClick={async () => { if (await run(REGENERATE_CATALOGUE, { id: r.id })) refetch() }}>Regenerate</Button>}
          {canWrite && !r.is_published && <Button size="small" color="error" onClick={() => setDeleting(r)}>Delete</Button>}
        </Stack>
      ),
    },
  ]
  return (
    <PageContainer>
      <PageHeader title="Catalogue PDFs" subtitle="Generated from live product data. Publish a version to make it the website download." count={rows.length} />
      {canWrite && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Generate a new catalogue</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Scope" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <MenuItem value="">All published products</MenuItem>
                  {categoryOptions(catData?.categories).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField select fullWidth size="small" label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <MenuItem value="en">English</MenuItem><MenuItem value="hi">हिंदी</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}><FormControlLabel control={<Switch checked={form.includePrices} onChange={(e) => setForm({ ...form, includePrices: e.target.checked })} />} label="Show prices" /></Grid>
              <Grid item xs={12} md={1}><Button variant="contained" fullWidth onClick={generate} disabled={loading || !form.title.trim()}>Generate</Button></Grid>
            </Grid>
            {form.language === 'hi' && <Alert severity="info" sx={{ mt: 2 }}>Hindi PDFs need a Devanagari font configured on the server (PDF_FONT_HI_PATH). Without it the server falls back to English text.</Alert>}
          </CardContent>
        </Card>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Stable website link: <Link href={publicFileUrl('/files/catalogues/latest?lang=en')} target="_blank" rel="noopener">/files/catalogues/latest?lang=en</Link> (add <code>&category=&lt;slug&gt;</code> for a category).
      </Typography>
      {error ? <ErrorState message={error.message} /> : <CustomTable tableId="catalogues" columns={columns} rows={rows} />}
      {rows.some((r) => r.status === 'failed') && <Alert severity="error" sx={{ mt: 2 }}>Failed: {rows.filter((r) => r.status === 'failed').map((r) => `${r.version_label} — ${r.error}`).join(' · ')}</Alert>}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={loading} title="Delete this version?" message={`${deleting?.version_label} will be removed permanently. Published versions cannot be deleted.`}
        onConfirm={async () => { if (await run(DELETE_CATALOGUE, { id: deleting.id })) { setDeleting(null); refetch() } }} />
    </PageContainer>
  )
}

export default Catalogues
