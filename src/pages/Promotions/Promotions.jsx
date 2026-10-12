/**
 * Offers & coupons (§7, §14.5). Discounts are always computed on the server;
 * the preview here runs the same engine customers hit.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Alert, Autocomplete, Box, Button, Chip, Divider, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Plus, Trash2 } from 'lucide-react'

import { CustomTable, CustomTextField, FilterDropdown, PageContainer, PageHeader, SidebarPanel, ErrorState } from '@/shared/components'
import { StatusChip, I18nField, MoneyField, Toolbar, en, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { PROMOTIONS, PROMOTION, SAVE_PROMOTION, SET_PROMOTION_STATUS, CREATE_COUPONS, SET_COUPON_ACTIVE, PREVIEW_CART, PRODUCTS, CATEGORIES } from '@/services/admin.api'
import { apolloClient } from '@/lib/graphql/client'
import { categoryOptions } from '@/utils/categories'
import { bpsToPercent, formatPaise, percentToBps } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const TYPES = {
  percentage: 'Percentage off',
  fixed_amount: 'Flat amount off',
  bundle_price: 'Bundle price (N units for ₹X)',
  buy_x_get_y: 'Buy X get Y free',
}

const describe = (p) => {
  if (p.promo_type === 'percentage') return `${bpsToPercent(p.value)}% off${p.max_discount_paise ? ` (max ${formatPaise(p.max_discount_paise)})` : ''}`
  if (p.promo_type === 'fixed_amount') return `${formatPaise(p.value)} off`
  if (p.promo_type === 'bundle_price') return `${p.bundle_quantity} for ${formatPaise(p.value)}`
  return `Buy ${p.buy_quantity} get ${p.get_quantity}`
}
const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
const fromLocal = (v) => (v ? new Date(v).toISOString() : null)

const blank = () => ({
  internal_name: '', title_i18n: { en: '' }, description_i18n: {}, promo_type: 'percentage', value: 500, scope: 'cart', targets: { products: [], categories: [] },
  min_quantity: 0, min_subtotal_paise: 0, max_discount_paise: null, buy_quantity: null, get_quantity: null, bundle_quantity: null,
  requires_coupon: false, is_stackable: false, priority: 100, usage_limit: null, per_customer_limit: null, starts_at: null, ends_at: null, show_on_offers_page: true,
})
const EDITABLE = Object.keys(blank())

const ProductPicker = ({ value, onChange }) => {
  const { data } = useQuery(PRODUCTS, { variables: { limit: 100, page: 1, status: 'published' } })
  const items = data?.products?.items || []
  return (
    <Autocomplete multiple options={items.map((p) => p.id)} getOptionLabel={(id) => items.find((p) => p.id === id)?.name || id}
      value={value} onChange={(_e, v) => onChange(v)} renderInput={(params) => <TextField {...params} size="small" label="Products" />} />
  )
}

const CartPreview = ({ promotion }) => {
  const { data } = useQuery(PRODUCTS, { variables: { limit: 100, page: 1, status: 'published' } })
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [coupon, setCoupon] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const products = data?.products?.items || []
  const preview = async () => {
    setError(null)
    try {
      const res = await apolloClient.query({
        query: PREVIEW_CART, fetchPolicy: 'network-only',
        variables: { input: { items: items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) || 1, selection: {} })), coupon_code: coupon || undefined } },
      })
      setResult(res.data.previewCart)
    } catch (e) { setError(e.message); setResult(null) }
  }
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Test a cart</Typography>
      <Typography variant="caption" color="text.secondary">Runs the live pricing engine against currently active offers{promotion?.status !== 'active' ? ' (this offer is not active, so it will not apply yet)' : ''}.</Typography>
      {items.map((it, i) => (
        <Stack key={i} direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField select size="small" label="Product" value={it.product_id} sx={{ flex: 1 }} onChange={(e) => setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, product_id: e.target.value } : x)))}>
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField size="small" type="number" label="Qty" value={it.quantity} sx={{ width: 80 }} onChange={(e) => setItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)))} />
          <IconButton onClick={() => setItems((xs) => xs.filter((_x, idx) => idx !== i))} disabled={items.length === 1}><Trash2 size={16} /></IconButton>
        </Stack>
      ))}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" onClick={() => setItems((xs) => [...xs, { product_id: '', quantity: 1 }])}>Add line</Button>
        <TextField size="small" label="Coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
        <Button variant="outlined" size="small" onClick={preview} disabled={!items.some((i) => i.product_id)}>Preview</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {result && (
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2">Subtotal {formatPaise(result.subtotal_paise)} · Discount <strong>{formatPaise(result.discount_paise)}</strong> · GST {formatPaise(result.tax_paise)} · Total <strong>{formatPaise(result.total_paise)}</strong></Typography>
          {(result.applied_promotions || []).map((a) => <Chip key={a.promotion_id} size="small" color="success" label={`${a.title}: −${formatPaise(a.discount_paise)}`} sx={{ mt: 1, mr: 1 }} />)}
          {result.coupon && !result.coupon.valid && <Alert severity="warning" sx={{ mt: 1 }}>{result.coupon.message}</Alert>}
        </Box>
      )}
    </Box>
  )
}

const Coupons = ({ promotion, refetch, canWrite }) => {
  const { run, loading } = useAction()
  const [codes, setCodes] = useState('')
  const [generate, setGenerate] = useState({ count: 10, prefix: 'KISAN', usageLimit: 1 })
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Coupons ({promotion.coupons.length})</Typography>
      {!promotion.requires_coupon && <Typography variant="caption" color="text.secondary" display="block">This offer applies automatically. Switch on “Needs a coupon code” and save to issue codes.</Typography>}
      {promotion.coupons.length > 0 && (
        <Table size="small" sx={{ mt: 1 }}>
          <TableHead><TableRow><TableCell>Code</TableCell><TableCell align="right">Used</TableCell><TableCell align="right">Active</TableCell></TableRow></TableHead>
          <TableBody>
            {promotion.coupons.slice(0, 50).map((c) => (
              <TableRow key={c.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</TableCell>
                <TableCell align="right">{c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</TableCell>
                <TableCell align="right"><Switch size="small" checked={c.is_active} disabled={!canWrite} onChange={async (e) => { if (await run(SET_COUPON_ACTIVE, { id: c.id, isActive: e.target.checked }, { silent: true })) refetch() }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {canWrite && promotion.requires_coupon && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth label="Add specific codes" placeholder="DIWALI24, MELA500" value={codes} onChange={(e) => setCodes(e.target.value.toUpperCase())} />
            <Button disabled={loading || !codes.trim()} onClick={async () => {
              if (await run(CREATE_COUPONS, { promotionId: promotion.id, codes: codes.split(/[\s,]+/).filter(Boolean) })) { setCodes(''); refetch() }
            }}>Add</Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField size="small" type="number" label="Generate" value={generate.count} onChange={(e) => setGenerate({ ...generate, count: Number(e.target.value) })} sx={{ width: 100 }} />
            <TextField size="small" label="Prefix" value={generate.prefix} onChange={(e) => setGenerate({ ...generate, prefix: e.target.value.toUpperCase() })} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Uses each" value={generate.usageLimit} onChange={(e) => setGenerate({ ...generate, usageLimit: Number(e.target.value) })} sx={{ width: 110 }} />
            <Button disabled={loading} onClick={async () => {
              if (await run(CREATE_COUPONS, { promotionId: promotion.id, generate: generate.count, prefix: generate.prefix, usageLimit: generate.usageLimit || null })) refetch()
            }}>Generate</Button>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}

const PromotionPanel = ({ id, onClose, onSaved }) => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:promotions:write')
  const isNew = id === 'new'
  const { data, refetch } = useQuery(PROMOTION, { variables: { id }, skip: !id || isNew, fetchPolicy: 'network-only' })
  const { data: catData } = useQuery(CATEGORIES)
  const { run, loading } = useAction()
  const [draft, setDraft] = useState(null)
  const [banner, setBanner] = useState(null)
  const promotion = data?.promotion
  const form = draft || (isNew ? blank() : promotion && Object.fromEntries(EDITABLE.map((k) => [k, promotion[k]])))
  const patch = (p) => setDraft({ ...form, ...p })

  const save = async () => {
    const saved = await run(SAVE_PROMOTION, { id: isNew ? null : id, input: form, banner })
    if (saved) { setDraft(null); setBanner(null); onSaved(saved.id) }
  }
  const setStatus = async (status) => { if (await run(SET_PROMOTION_STATUS, { id, status })) { refetch(); onSaved(id) } }

  return (
    <SidebarPanel open={Boolean(id)} onClose={() => { setDraft(null); onClose() }} title={isNew ? 'New offer' : form?.internal_name || 'Offer'} onSave={canWrite ? save : undefined} loading={loading}
      headerActions={promotion && canWrite && (
        <Stack direction="row" spacing={1}>
          {promotion.status !== 'active' && <Button size="small" variant="contained" color="success" onClick={() => setStatus('active')}>Activate</Button>}
          {promotion.status === 'active' && <Button size="small" color="warning" onClick={() => setStatus('paused')}>Pause</Button>}
          {promotion.status !== 'archived' && <Button size="small" color="error" onClick={() => setStatus('archived')}>Archive</Button>}
        </Stack>
      )}>
      {form && (
        <Stack spacing={2}>
          {promotion && <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={promotion.status} /><Typography variant="body2">Used {promotion.usage_count} times</Typography></Stack>}
          <TextField size="small" label="Internal name" value={form.internal_name} onChange={(e) => patch({ internal_name: e.target.value })} required />
          <I18nField label="Customer-facing title" value={form.title_i18n} onChange={(v) => patch({ title_i18n: v })} requiredEn />
          <I18nField label="Description / terms" value={form.description_i18n} onChange={(v) => patch({ description_i18n: v })} multiline />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Offer type" value={form.promo_type} onChange={(e) => patch({ promo_type: e.target.value })}>
                {Object.entries(TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              {form.promo_type === 'percentage' && <TextField fullWidth size="small" type="number" label="Percent off" value={bpsToPercent(form.value)} onChange={(e) => patch({ value: percentToBps(e.target.value) ?? 0 })} />}
              {['fixed_amount', 'bundle_price'].includes(form.promo_type) && <MoneyField label={form.promo_type === 'bundle_price' ? 'Bundle price' : 'Amount off'} paise={form.value} onChange={(v) => patch({ value: v ?? 0 })} />}
              {form.promo_type === 'buy_x_get_y' && (
                <Stack direction="row" spacing={1}>
                  <TextField size="small" type="number" label="Buy" value={form.buy_quantity ?? ''} onChange={(e) => patch({ buy_quantity: Number(e.target.value) || null })} />
                  <TextField size="small" type="number" label="Get free" value={form.get_quantity ?? ''} onChange={(e) => patch({ get_quantity: Number(e.target.value) || null })} />
                </Stack>
              )}
            </Grid>
            {form.promo_type === 'bundle_price' && <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Units in bundle" value={form.bundle_quantity ?? ''} onChange={(e) => patch({ bundle_quantity: Number(e.target.value) || null })} /></Grid>}
            {form.promo_type === 'percentage' && <Grid item xs={6}><MoneyField label="Maximum discount" paise={form.max_discount_paise} onChange={(v) => patch({ max_discount_paise: v })} helperText="Blank = no cap" /></Grid>}
          </Grid>
          <TextField select size="small" label="Applies to" value={form.scope} onChange={(e) => patch({ scope: e.target.value })}>
            <MenuItem value="cart">Whole enquiry</MenuItem><MenuItem value="product">Selected products</MenuItem><MenuItem value="category">Selected categories</MenuItem>
          </TextField>
          {form.scope === 'product' && <ProductPicker value={form.targets?.products || []} onChange={(v) => patch({ targets: { ...form.targets, products: v } })} />}
          {form.scope === 'category' && (
            <Autocomplete multiple options={categoryOptions(catData?.categories).map((o) => o.value)} getOptionLabel={(v) => categoryOptions(catData?.categories).find((o) => o.value === v)?.label || v}
              value={form.targets?.categories || []} onChange={(_e, v) => patch({ targets: { ...form.targets, categories: v } })} renderInput={(params) => <TextField {...params} size="small" label="Categories" />} />
          )}
          <Grid container spacing={2}>
            <Grid item xs={6}><MoneyField label="Minimum spend" paise={form.min_subtotal_paise} onChange={(v) => patch({ min_subtotal_paise: v ?? 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Minimum quantity" value={form.min_quantity} onChange={(e) => patch({ min_quantity: Number(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Starts" InputLabelProps={{ shrink: true }} value={toLocal(form.starts_at)} onChange={(e) => patch({ starts_at: fromLocal(e.target.value) })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="datetime-local" label="Ends" InputLabelProps={{ shrink: true }} value={toLocal(form.ends_at)} onChange={(e) => patch({ ends_at: fromLocal(e.target.value) })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Total uses" value={form.usage_limit ?? ''} onChange={(e) => patch({ usage_limit: e.target.value === '' ? null : Number(e.target.value) })} helperText="Blank = unlimited" /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Per customer" value={form.per_customer_limit ?? ''} onChange={(e) => patch({ per_customer_limit: e.target.value === '' ? null : Number(e.target.value) })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Priority" value={form.priority} onChange={(e) => patch({ priority: Number(e.target.value) || 100 })} helperText="Lower runs first" /></Grid>
          </Grid>
          <FormControlLabel control={<Switch checked={form.requires_coupon} onChange={(e) => patch({ requires_coupon: e.target.checked })} />} label="Needs a coupon code" />
          <FormControlLabel control={<Switch checked={form.is_stackable} onChange={(e) => patch({ is_stackable: e.target.checked })} />} label="Can combine with other offers" />
          <FormControlLabel control={<Switch checked={form.show_on_offers_page} onChange={(e) => patch({ show_on_offers_page: e.target.checked })} />} label="Show on the Offers page" />
          <Button component="label" variant="outlined">{banner ? banner.name : 'Upload banner image'}<input hidden type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} /></Button>
          {promotion && (
            <>
              <Divider />
              <Coupons promotion={promotion} refetch={refetch} canWrite={canWrite} />
              <Divider />
              <CartPreview promotion={promotion} />
            </>
          )}
        </Stack>
      )}
    </SidebarPanel>
  )
}

const Promotions = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:promotions:write')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const variables = useMemo(() => ({ status: status === 'all' ? undefined : status, search: search.trim() || undefined }), [status, search])
  const { data, error, refetch } = useQuery(PROMOTIONS, { variables, fetchPolicy: 'cache-and-network' })
  const rows = data?.promotions || []
  const columns = [
    { id: 'internal_name', label: 'Offer', minWidth: 220, format: (v, r) => <><Typography variant="body2" sx={{ fontWeight: 800 }}>{v}</Typography><Typography variant="caption" color="text.secondary">{en(r.title_i18n)}</Typography></> },
    { id: 'promo_type', label: 'Deal', format: (_v, r) => describe(r) },
    { id: 'scope', label: 'Applies to', format: (v, r) => (v === 'cart' ? 'Whole enquiry' : `${(r.targets?.[v === 'product' ? 'products' : 'categories'] || []).length} ${v}(s)`) },
    { id: 'requires_coupon', label: 'Coupon', format: (v, r) => (v ? `Required (${r.coupon_count})` : r.coupon_count ? `${r.coupon_count} codes` : 'Automatic') },
    { id: 'starts_at', label: 'Runs', format: (v, r) => `${v ? formatDate(v, 'short') : 'Now'} → ${r.ends_at ? formatDate(r.ends_at, 'short') : 'No end'}` },
    { id: 'usage_count', label: 'Used', align: 'right' },
    { id: 'total_discount_paise', label: 'Discount given', align: 'right', format: (v) => formatPaise(v) },
    { id: 'status', label: 'Status', format: (v) => <StatusChip status={v} /> },
  ]
  return (
    <PageContainer>
      <PageHeader title="Offers & coupons" subtitle="Seasonal discounts, bundles and coupon codes. Applied on enquiries and carried into quotations." count={rows.length}
        actionLabel={canWrite ? 'New offer' : undefined} actionIcon={<Plus size={18} />} onAction={canWrite ? () => setSelected('new') : undefined} />
      <Toolbar>
        <CustomTextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }} />
        <FilterDropdown label="Status" options={['draft', 'active', 'paused', 'archived'].map((s) => ({ value: s, label: humanize(s) }))} value={status} onChange={setStatus} />
      </Toolbar>
      {error ? <ErrorState message={error.message} /> : <CustomTable tableId="promotions" columns={columns} rows={rows} onRowClick={(r) => setSelected(r.id)} />}
      <PromotionPanel id={selected} onClose={() => setSelected(null)} onSaved={(newId) => { refetch(); setSelected(newId) }} />
    </PageContainer>
  )
}

export default Promotions
