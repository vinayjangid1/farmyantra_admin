/**
 * Stock, dispatch window and made-to-order waiting time (§24.1), plus the
 * production template and reward points. The website shows "ships in about
 * 1–3 days" or "made to order · about 3 weeks" from these values.
 */
import { useQuery } from '@apollo/client'
import { Alert, FormControlLabel, Grid, MenuItem, Switch, TextField, Typography } from '@mui/material'

import { useAction } from '@/shared/hooks/useAction'
import { UPDATE_PRODUCT, MANUFACTURING_TEMPLATES } from '@/services/admin.api'
import { useForm, int, Section, SaveBar } from './shared'

const FIELDS = ['fulfilment_type', 'stock_qty', 'dispatch_min_days', 'dispatch_max_days', 'lead_time_min_days', 'lead_time_max_days', 'lead_time_display_unit',
  'availability_override', 'manufacturing_template_id', 'points_per_unit', 'points_excluded']

const preview = (f) => {
  const w = (a, b) => (a === b ? `${a}` : `${a}–${b}`)
  if (f.availability_override === 'coming_soon') return 'Coming soon'
  if (f.availability_override === 'discontinued') return 'Discontinued (hidden from new requests)'
  if (f.fulfilment_type === 'in_stock') {
    if (!Number(f.stock_qty)) return 'Out of stock · we will confirm the waiting time'
    return `Ready to dispatch · ships in about ${w(f.dispatch_min_days || 1, f.dispatch_max_days || 3)} days`
  }
  if (!f.lead_time_max_days) return 'Made to order · waiting time confirmed by our team'
  if (f.lead_time_display_unit === 'weeks' || f.lead_time_max_days >= 21) return `Made to order · about ${w(Math.max(1, Math.round((f.lead_time_min_days || f.lead_time_max_days) / 7)), Math.round(f.lead_time_max_days / 7))} weeks`
  return `Made to order · about ${w(f.lead_time_min_days || f.lead_time_max_days, f.lead_time_max_days)} days`
}

const FulfilmentTab = ({ product, refetch, canWrite }) => {
  const [form, set] = useForm(Object.fromEntries(FIELDS.map((f) => [f, product[f] ?? (f === 'points_excluded' ? false : '')])))
  const { data } = useQuery(MANUFACTURING_TEMPLATES)
  const { run, loading } = useAction()
  const field = (key, label, props = {}) => <TextField fullWidth size="small" label={label} value={form[key] ?? ''} onChange={set(key)} disabled={!canWrite} {...props} />
  const save = async () => {
    const input = {
      fulfilment_type: form.fulfilment_type || 'made_to_order',
      availability_override: form.availability_override || null,
      lead_time_display_unit: form.lead_time_display_unit || 'days',
      manufacturing_template_id: form.manufacturing_template_id || null,
      points_excluded: Boolean(form.points_excluded),
      ...Object.fromEntries(['stock_qty', 'dispatch_min_days', 'dispatch_max_days', 'lead_time_min_days', 'lead_time_max_days', 'points_per_unit'].map((k) => [k, int(form[k])])),
    }
    if (await run(UPDATE_PRODUCT, { id: product.id, input }, { success: 'Fulfilment saved' })) refetch()
  }
  const mto = form.fulfilment_type !== 'in_stock'
  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>Customers see: <strong>{preview(form)}</strong>. Estimates are always shown as “about” — never a promise.</Alert>
      <Section title="How it is supplied">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>{field('fulfilment_type', 'Supply', { select: true, children: [<MenuItem key="in_stock" value="in_stock">From stock</MenuItem>, <MenuItem key="mto" value="made_to_order">Made to order</MenuItem>] })}</Grid>
          <Grid item xs={12} md={4}>{field('availability_override', 'Override', { select: true, children: [<MenuItem key="" value="">None</MenuItem>, <MenuItem key="cs" value="coming_soon">Coming soon</MenuItem>, <MenuItem key="d" value="discontinued">Discontinued</MenuItem>] })}</Grid>
        </Grid>
      </Section>
      {!mto && (
        <Section title="Stock" subtitle="Quantity in the warehouse. When it runs out, new requests are told the waiting time is confirmed by the team.">
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>{field('stock_qty', 'In stock', { type: 'number' })}</Grid>
            <Grid item xs={6} md={3}>{field('dispatch_min_days', 'Dispatch from (days)', { type: 'number' })}</Grid>
            <Grid item xs={6} md={3}>{field('dispatch_max_days', 'Dispatch up to (days)', { type: 'number' })}</Grid>
          </Grid>
        </Section>
      )}
      {mto && (
        <Section title="Waiting time" subtitle="Working days from order confirmation until the machine is ready. Options can add days (Customisation tab).">
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>{field('lead_time_min_days', 'From (days)', { type: 'number' })}</Grid>
            <Grid item xs={6} md={3}>{field('lead_time_max_days', 'Up to (days)', { type: 'number' })}</Grid>
            <Grid item xs={6} md={3}>{field('lead_time_display_unit', 'Show as', { select: true, children: [<MenuItem key="d" value="days">Days</MenuItem>, <MenuItem key="w" value="weeks">Weeks</MenuItem>] })}</Grid>
            <Grid item xs={12} md={6}>
              {field('manufacturing_template_id', 'Production stages', {
                select: true,
                helperText: 'Empty = category template or the default',
                children: [<MenuItem key="" value="">Use category / default</MenuItem>, ...(data?.manufacturingTemplates || []).filter((t) => t.is_active).map((t) => <MenuItem key={t.id} value={t.id}>{t.name} (about {t.total_planned_days} days)</MenuItem>)],
              })}
            </Grid>
          </Grid>
        </Section>
      )}
      <Section title="Reward points" subtitle="Used when Rewards → Earn rule is “fixed points per product”.">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} md={3}>{field('points_per_unit', 'Points per unit', { type: 'number' })}</Grid>
          <Grid item xs={12} md={5}><FormControlLabel control={<Switch checked={Boolean(form.points_excluded)} onChange={(e) => set('points_excluded')(e.target.checked)} disabled={!canWrite} />} label="This product never earns points" /></Grid>
        </Grid>
      </Section>
      {canWrite && <SaveBar onSave={save} loading={loading} />}
      {!canWrite && <Typography variant="body2" color="text.secondary">Read only.</Typography>}
    </>
  )
}

export default FulfilmentTab
