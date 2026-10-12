/** Product list (§14.2): search, filter by status / category / availability, create, duplicate. */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { Plus } from 'lucide-react'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, SidebarPanel, ErrorState } from '@/shared/components'
import { StatusChip, usePagedQuery, Toolbar, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { PRODUCTS, CATEGORIES, CREATE_PRODUCT } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { formatPaise } from '@/utils/money'
import { formatRelativeTime } from '@/utils/dateFormatter'
import { categoryOptions } from '@/utils/categories'

const AVAILABILITY = ['in_stock', 'made_to_order', 'out_of_stock', 'coming_soon', 'discontinued']

const CreateProductPanel = ({ open, onClose, categories }) => {
  const navigate = useNavigate()
  const { run, loading } = useAction()
  const [form, setForm] = useState({ name: '', sku: '', category_id: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    const created = await run(CREATE_PRODUCT, { input: { ...form, category_id: form.category_id || null } }, { success: 'Draft product created' })
    if (created?.id) navigate(`/products/${created.id}`)
  }
  return (
    <SidebarPanel open={open} onClose={onClose} title="New product" onSave={save} saveLabel="Create draft" loading={loading}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">Products start as drafts. Add images, prices and details, then publish when the checklist is clear.</Typography>
        <TextField label="Product name (English)" required value={form.name} onChange={set('name')} />
        <TextField label="SKU" required value={form.sku} onChange={set('sku')} helperText="Letters, numbers, dot, dash, underscore" />
        <TextField select SelectProps={{ native: true }} label="Category" value={form.category_id} onChange={set('category_id')} InputLabelProps={{ shrink: true }}>
          <option value="">— Choose later —</option>
          {categoryOptions(categories).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </TextField>
      </Stack>
    </SidebarPanel>
  )
}

const Products = () => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:products:write')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [missingHindi, setMissingHindi] = useState(false)
  const [creating, setCreating] = useState(false)
  const { data: catData } = useQuery(CATEGORIES)
  const categories = catData?.categories || []

  const variables = useMemo(() => ({
    search: search.trim() || undefined,
    status: status === 'all' ? undefined : status,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    availability: availability === 'all' ? undefined : availability,
    missingHindi: missingHindi || undefined,
  }), [search, status, categoryId, availability, missingHindi])
  const list = usePagedQuery(PRODUCTS, 'products', variables)
  const reset = (fn) => (v) => { fn(v); list.resetPage() }

  const columns = [
    {
      id: 'name', label: 'Product', minWidth: 260,
      format: (v, r) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" src={mediaUrl(r.image_url)} sx={{ width: 44, height: 44, bgcolor: 'grey.100' }}>{(v || '?')[0]}</Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{v || '(untitled)'}</Typography>
            <Typography variant="caption" color="text.secondary">{r.sku}{r.model ? ` · ${r.model}` : ''}</Typography>
          </Box>
        </Stack>
      ),
    },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
    { id: 'base_price_paise', label: 'Price', align: 'right', format: (v, r) => (r.price_display === 'on_request' ? 'On request' : `${r.price_display === 'starting_from' ? 'From ' : ''}${formatPaise(v)}`) },
    { id: 'availability', label: 'Availability', format: (v) => humanize(v) },
    {
      id: 'languages', label: 'Languages',
      format: (v) => (
        <Stack direction="row" spacing={0.5}>
          {['en', 'hi'].map((l) => <Chip key={l} size="small" label={l.toUpperCase()} color={v?.includes(l) ? 'success' : 'default'} variant={v?.includes(l) ? 'filled' : 'outlined'} />)}
        </Stack>
      ),
    },
    { id: 'customisation_enabled', label: 'Customisable', format: (v) => (v ? 'Yes' : '—') },
    { id: 'enquiry_count', label: 'Enquiries', align: 'right' },
    { id: 'updated_at', label: 'Updated', format: (v) => formatRelativeTime(v) },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Products" subtitle="Machines, implements and spares shown on the website" count={list.total}
        actionLabel={canWrite ? 'New product' : undefined} actionIcon={<Plus size={18} />} onAction={canWrite ? () => setCreating(true) : undefined}
      />
      <Toolbar>
        <CustomTextField label="Search" placeholder="Name, SKU, model, brand…" value={search} onChange={(e) => reset(setSearch)(e.target.value)} sx={{ minWidth: 260 }} />
        <FilterDropdown label="Status" options={['draft', 'published', 'archived'].map((s) => ({ value: s, label: humanize(s) }))} value={status} onChange={reset(setStatus)} />
        <FilterDropdown label="Category" options={categoryOptions(categories)} value={categoryId} onChange={reset(setCategoryId)} allLabel="All categories" />
        <FilterDropdown label="Availability" options={AVAILABILITY.map((s) => ({ value: s, label: humanize(s) }))} value={availability} onChange={reset(setAvailability)} />
        <FormControlLabel control={<Switch checked={missingHindi} onChange={(e) => reset(setMissingHindi)(e.target.checked)} />} label="Missing Hindi" />
      </Toolbar>
      {list.error ? <ErrorState message={list.error.message} /> : (
        <CustomTable
          tableId="products" columns={columns} rows={list.rows} page={list.page} rowsPerPage={list.rowsPerPage} totalRows={list.total}
          onPageChange={list.onPageChange} onRowsPerPageChange={list.onRowsPerPageChange} onRowClick={(r) => navigate(`/products/${r.id}`)}
        />
      )}
      {creating && <CreateProductPanel open onClose={() => setCreating(false)} categories={categories} />}
    </PageContainer>
  )
}

export default Products
