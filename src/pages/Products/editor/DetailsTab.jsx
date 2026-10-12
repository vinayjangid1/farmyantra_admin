import { Autocomplete, Chip, FormControlLabel, Grid, MenuItem, Switch, TextField } from '@mui/material'

import { useAction } from '@/shared/hooks/useAction'
import { humanize } from '@/shared/components/fy'
import { UPDATE_PRODUCT } from '@/services/admin.api'
import { categoryOptions } from '@/utils/categories'
import { useForm, num, int, Section, SaveBar } from './shared'

const FUELS = ['diesel', 'petrol', 'electric', 'manual', 'tractor_pto', 'solar', 'hybrid', 'other']
const FIELDS = ['slug', 'sku', 'model', 'brand', 'category_id', 'warranty_months', 'min_order_qty', 'max_order_qty',
  'power_hp', 'capacity_value', 'capacity_unit', 'fuel_type', 'weight_kg', 'length_mm', 'width_mm', 'height_mm', 'intended_use', 'tags',
  'is_featured', 'is_new_arrival', 'display_order']

const DetailsTab = ({ product, categories, refetch, canWrite }) => {
  const [form, set] = useForm(Object.fromEntries(FIELDS.map((f) => [f, product[f] ?? (f === 'intended_use' || f === 'tags' ? [] : '')])))
  const { run, loading } = useAction()
  const field = (key, label, props = {}) => (
    <TextField fullWidth size="small" label={label} value={form[key] ?? ''} onChange={set(key)} disabled={!canWrite} {...props} />
  )
  const save = async () => {
    const input = {
      ...form,
      category_id: form.category_id || null,
      model: form.model || null,
      brand: form.brand || null,
      fuel_type: form.fuel_type || null,
      capacity_unit: form.capacity_unit || null,
      warranty_months: int(form.warranty_months),
      min_order_qty: int(form.min_order_qty) || 1,
      max_order_qty: int(form.max_order_qty),
      display_order: int(form.display_order) || 0,
      ...Object.fromEntries(['power_hp', 'capacity_value', 'weight_kg', 'length_mm', 'width_mm', 'height_mm'].map((k) => [k, num(form[k])])),
    }
    if (await run(UPDATE_PRODUCT, { id: product.id, input }, { success: 'Product details saved' })) refetch()
  }
  const tagsField = (key, label, helper) => (
    <Autocomplete
      multiple freeSolo options={[]} value={form[key] || []} onChange={(_e, v) => set(key)(v.map((s) => s.trim()).filter(Boolean))} disabled={!canWrite}
      renderTags={(value, getTagProps) => value.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} key={option} />)}
      renderInput={(params) => <TextField {...params} size="small" label={label} helperText={helper} />}
    />
  )
  return (
    <>
      <Section title="Identity" subtitle="The slug is the web address: /product/<slug>">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>{field('slug', 'Slug')}</Grid>
          <Grid item xs={12} md={6}>{field('sku', 'SKU')}</Grid>
          <Grid item xs={12} md={4}>{field('model', 'Model')}</Grid>
          <Grid item xs={12} md={4}>{field('brand', 'Brand')}</Grid>
          <Grid item xs={12} md={4}>
            {field('category_id', 'Category', { select: true, children: [<MenuItem key="" value="">— None —</MenuItem>, ...categoryOptions(categories).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)] })}
          </Grid>
        </Grid>
      </Section>
      <Section title="Availability & ordering">
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}>{field('warranty_months', 'Warranty (months)', { type: 'number' })}</Grid>
          <Grid item xs={6} md={4}>{field('min_order_qty', 'Minimum quantity', { type: 'number' })}</Grid>
          <Grid item xs={6} md={4}>{field('max_order_qty', 'Maximum quantity', { type: 'number', helperText: 'Blank = no limit' })}</Grid>
          <Grid item xs={6} md={4}>{field('display_order', 'Sort order', { type: 'number' })}</Grid>
        </Grid>
      </Section>
      <Section title="Filterable attributes" subtitle="Used by shop filters and the comparison table">
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>{field('power_hp', 'Power (HP)', { type: 'number' })}</Grid>
          <Grid item xs={6} md={3}>{field('fuel_type', 'Fuel / drive', { select: true, children: [<MenuItem key="" value="">—</MenuItem>, ...FUELS.map((f) => <MenuItem key={f} value={f}>{humanize(f)}</MenuItem>)] })}</Grid>
          <Grid item xs={6} md={3}>{field('capacity_value', 'Capacity', { type: 'number' })}</Grid>
          <Grid item xs={6} md={3}>{field('capacity_unit', 'Capacity unit', { placeholder: 'litres, kg/hr, acres/day…' })}</Grid>
          <Grid item xs={6} md={3}>{field('weight_kg', 'Weight (kg)', { type: 'number' })}</Grid>
          <Grid item xs={6} md={3}>{field('length_mm', 'Length (mm)', { type: 'number' })}</Grid>
          <Grid item xs={6} md={3}>{field('width_mm', 'Width (mm)', { type: 'number' })}</Grid>
          <Grid item xs={6} md={3}>{field('height_mm', 'Height (mm)', { type: 'number' })}</Grid>
          <Grid item xs={12} md={6}>{tagsField('intended_use', 'Intended use', 'e.g. tilling, spraying, threshing — press Enter after each')}</Grid>
          <Grid item xs={12} md={6}>{tagsField('tags', 'Search tags', 'Extra words customers search for')}</Grid>
        </Grid>
      </Section>
      <Section title="Merchandising">
        <FormControlLabel control={<Switch checked={Boolean(form.is_featured)} onChange={set('is_featured')} disabled={!canWrite} />} label="Featured on home page" />
        <FormControlLabel control={<Switch checked={Boolean(form.is_new_arrival)} onChange={set('is_new_arrival')} disabled={!canWrite} />} label="New arrival badge" />
      </Section>
      {canWrite && <SaveBar onSave={save} loading={loading} />}
    </>
  )
}

export default DetailsTab
