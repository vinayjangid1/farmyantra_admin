import { useQuery } from '@apollo/client'
import { Alert, Grid, MenuItem, TextField, Typography } from '@mui/material'

import { useAction } from '@/shared/hooks/useAction'
import { MoneyField } from '@/shared/components/fy'
import { usePermissions } from '@/features/permissions'
import { UPDATE_PRODUCT, TAX_RULES } from '@/services/admin.api'
import { bpsToPercent, formatPaise } from '@/utils/money'
import { useForm, Section, SaveBar } from './shared'

const DISPLAY = [
  { value: 'fixed', label: 'Fixed price', help: 'Shows “₹X”. Options cannot change the price.' },
  { value: 'starting_from', label: 'Starting from', help: 'Shows “Starting from ₹X” — colours / add-ons may add to it.' },
  { value: 'on_request', label: 'Price on request', help: 'No price shown; customers request a quotation.' },
]

const PricingTab = ({ product, refetch, canWrite }) => {
  const { hasPermission } = usePermissions()
  const { data } = useQuery(TAX_RULES, { skip: !hasPermission('admin:pricing:read') })
  const [form, set] = useForm({
    price_display: product.price_display,
    base_price_paise: product.base_price_paise,
    mrp_paise: product.mrp_paise,
    tax_rule_id: product.tax_rule_id || '',
    change_reason: '',
  })
  const { run, loading } = useAction()
  const rules = data?.taxRules || []
  const save = async () => {
    const input = { ...form, tax_rule_id: form.tax_rule_id || null, change_reason: form.change_reason || undefined }
    if (await run(UPDATE_PRODUCT, { id: product.id, input }, { success: 'Pricing saved' })) refetch()
  }
  const mrpBelowPrice = form.mrp_paise && form.base_price_paise && form.mrp_paise < form.base_price_paise
  return (
    <>
      <Section title="How the price is shown" subtitle="All prices are exclusive of GST. Tax is added on quotations according to the tax rule.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth size="small" label="Price display" value={form.price_display} onChange={set('price_display')} disabled={!canWrite}
              helperText={DISPLAY.find((d) => d.value === form.price_display)?.help}>
              {DISPLAY.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={4}>
            <MoneyField label="Base price" paise={form.base_price_paise} onChange={set('base_price_paise')} disabled={!canWrite}
              helperText={form.price_display === 'on_request' ? 'Optional — used as a starting point for quotations' : 'Required to publish'} />
          </Grid>
          <Grid item xs={6} md={4}>
            <MoneyField label="MRP (optional)" paise={form.mrp_paise} onChange={set('mrp_paise')} disabled={!canWrite} helperText="Shown struck-through when higher than the price" />
          </Grid>
        </Grid>
        {mrpBelowPrice && <Alert severity="warning" sx={{ mt: 2 }}>MRP is lower than the price — it will not be shown.</Alert>}
      </Section>
      <Section title="Tax">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField select fullWidth size="small" label="Tax rule" value={form.tax_rule_id} onChange={set('tax_rule_id')} disabled={!canWrite} helperText="Blank uses the default rule (Settings → Tax)">
              <MenuItem value="">Default rule</MenuItem>
              {rules.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} — {bpsToPercent(r.rate_bps)}% {r.hsn_code ? `(HSN ${r.hsn_code})` : ''}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Section>
      {canWrite && (
        <Section title="Reason for change" subtitle="Price changes are recorded in the audit log with this note.">
          <TextField fullWidth size="small" value={form.change_reason} onChange={set('change_reason')} placeholder="e.g. Steel cost increase, Diwali pricing" />
          <Typography variant="caption" color="text.secondary">
            Current: {product.price_display === 'on_request' ? 'on request' : formatPaise(product.base_price_paise)}. Open quotations keep their own prices.
          </Typography>
        </Section>
      )}
      {canWrite && <SaveBar onSave={save} loading={loading} />}
    </>
  )
}

export default PricingTab
