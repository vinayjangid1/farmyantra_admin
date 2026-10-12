/**
 * Editable order lines for "create order" and "propose change" (§25.3–§25.4).
 * Catalogue lines are re-priced by the server; a changed price needs a reason.
 * Custom lines (no product) carry their own description, HSN and GST rate.
 */
import { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { Autocomplete, Box, Button, Grid, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Plus, Trash2 } from 'lucide-react'

import { MoneyField } from '@/shared/components/fy'
import { PRODUCTS } from '@/services/admin.api'
import { formatPaise } from '@/utils/money'

const ProductSearch = ({ onPick }) => {
  const [load, { data, loading }] = useLazyQuery(PRODUCTS)
  const options = data?.products?.items || []
  return (
    <Autocomplete
      size="small" sx={{ minWidth: 280, flex: 1 }} options={options} loading={loading} filterOptions={(x) => x}
      getOptionLabel={(o) => `${o.name || o.sku} · ${o.sku}`}
      onInputChange={(_e, value) => { if (value.length >= 2) load({ variables: { search: value, status: 'published', limit: 10 } }) }}
      onChange={(_e, value) => { if (value) onPick(value) }}
      renderInput={(params) => <TextField {...params} label="Add a product (type to search)" />}
    />
  )
}

const LineEditor = ({ lines, onChange, disabled }) => {
  const [custom, setCustom] = useState(false)
  const patch = (idx, p) => onChange(lines.map((l, i) => (i === idx ? { ...l, ...p } : l)))
  return (
    <Box>
      {lines.map((l, idx) => {
        const priceChanged = l.product_id && l.unit_price_paise !== null && l.unit_price_paise !== undefined && l.unit_price_paise !== l.original_unit_price_paise
        return (
          <Box key={l.item_key || idx} sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={4}>
                {l.product_id
                  ? <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.description}</Typography>
                  : <TextField size="small" fullWidth label="Description" value={l.description} disabled={disabled} onChange={(e) => patch(idx, { description: e.target.value })} />}
              </Grid>
              <Grid item xs={4} md={1.5}><TextField size="small" type="number" label="Qty" value={l.quantity} disabled={disabled} inputProps={{ min: 1 }} onChange={(e) => patch(idx, { quantity: e.target.value })} /></Grid>
              <Grid item xs={8} md={2.5}><MoneyField label={l.product_id && l.original_unit_price_paise === undefined ? 'Unit price (auto)' : 'Unit price'} paise={l.unit_price_paise} disabled={disabled} onChange={(v) => patch(idx, { unit_price_paise: v })} /></Grid>
              <Grid item xs={8} md={2}><MoneyField label="Discount" paise={l.discount_paise} disabled={disabled} onChange={(v) => patch(idx, { discount_paise: v ?? 0 })} /></Grid>
              <Grid item xs={4} md={2} sx={{ textAlign: 'right' }}>
                <IconButton aria-label="Remove line" disabled={disabled} onClick={() => onChange(lines.filter((_x, i) => i !== idx))}><Trash2 size={18} /></IconButton>
              </Grid>
              {!l.product_id && (
                <>
                  <Grid item xs={6} md={2}><TextField size="small" label="HSN/SAC" value={l.hsn_code || ''} disabled={disabled} onChange={(e) => patch(idx, { hsn_code: e.target.value })} /></Grid>
                  <Grid item xs={6} md={2}><TextField size="small" type="number" label="GST %" value={(l.tax_rate_bps ?? 1800) / 100} disabled={disabled} onChange={(e) => patch(idx, { tax_rate_bps: Math.round(Number(e.target.value) * 100) })} /></Grid>
                </>
              )}
              {priceChanged && (
                <Grid item xs={12}>
                  <TextField size="small" fullWidth required label={l.original_unit_price_paise === undefined ? 'Reason for setting a price different from the catalogue' : `Reason for changing the price from ${formatPaise(l.original_unit_price_paise)}`} value={l.price_override_reason} disabled={disabled} onChange={(e) => patch(idx, { price_override_reason: e.target.value })} />
                </Grid>
              )}
            </Grid>
          </Box>
        )
      })}
      {!disabled && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }} alignItems={{ sm: 'center' }}>
          <ProductSearch onPick={(p) => onChange([...lines, { product_id: p.id, description: p.name || p.sku, quantity: Math.max(1, p.min_order_qty || 1), unit_price_paise: null, discount_paise: 0, price_override_reason: '' }])} />
          <Button startIcon={<Plus size={16} />} onClick={() => { setCustom(true); onChange([...lines, { product_id: null, description: '', quantity: 1, unit_price_paise: 0, discount_paise: 0, hsn_code: '', tax_rate_bps: 1800 }]) }}>
            {custom ? 'Another custom line' : 'Custom line'}
          </Button>
        </Stack>
      )}
    </Box>
  )
}

export default LineEditor
