/**
 * Customisation (§6, §19): admin-approved colours, add-ons with
 * requires/excludes rules, and text personalisation with placements.
 * Everything is OFF until switched on here; the server re-validates every
 * selection against these rules when an enquiry is submitted.
 */
import { useState } from 'react'
import {
  Alert, Autocomplete, Box, Button, Chip, FormControlLabel, Grid, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Plus } from 'lucide-react'

import { SidebarPanel } from '@/shared/components'
import { I18nField, MoneyField, en, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import {
  UPDATE_PRODUCT, SAVE_COLOUR, SAVE_ADDON, SAVE_PERSONALISATION, SAVE_PLACEMENT, SET_OPTION_ACTIVE, UPLOAD_OPTION_IMAGE,
} from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { formatPaise } from '@/utils/money'
import { Section, SaveBar } from './shared'

const ADDON_TYPES = ['accessory', 'attachment', 'upgrade', 'spare_part', 'service', 'package']
const signed = (paise) => (paise ? `${paise > 0 ? '+' : '−'}${formatPaise(Math.abs(paise))}` : 'No change')

const ImageUpload = ({ productId, value, onChange, label = 'Preview image' }) => {
  const { run, loading } = useAction()
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {value && <Box component="img" src={mediaUrl(value)} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }} />}
      <Button component="label" variant="outlined" size="small" disabled={loading}>
        {value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          const res = await run(UPLOAD_OPTION_IMAGE, { productId, file }, { silent: true })
          if (res?.url) onChange(res.url)
        }} />
      </Button>
      {value && <Button size="small" color="error" onClick={() => onChange(null)}>Remove</Button>}
    </Stack>
  )
}

/** Generic editor panel; `fields` renders the body for the current draft. */
const OptionPanel = ({ title, draft, setDraft, onSave, onClose, loading, children }) => (
  <SidebarPanel open={Boolean(draft)} onClose={onClose} title={title} onSave={onSave} loading={loading}>
    {draft && <Stack spacing={2}>{children(draft, (patch) => setDraft((d) => ({ ...d, ...patch })))}</Stack>}
  </SidebarPanel>
)

const OptionTable = ({ rows, columns, onEdit, onToggle, canWrite, empty }) => (
  rows.length === 0 ? <Typography variant="body2" color="text.secondary">{empty}</Typography> : (
    <Table size="small">
      <TableHead><TableRow>{columns.map((c) => <TableCell key={c.label}>{c.label}</TableCell>)}<TableCell align="right">Active</TableCell></TableRow></TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} hover sx={{ cursor: canWrite ? 'pointer' : 'default', opacity: r.is_active ? 1 : 0.5 }} onClick={() => canWrite && onEdit(r)}>
            {columns.map((c) => <TableCell key={c.label}>{c.render(r)}</TableCell>)}
            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
              <Switch size="small" checked={r.is_active} disabled={!canWrite} onChange={(e) => onToggle(r, e.target.checked)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
)

const CustomisationTab = ({ product, refetch, canWrite }) => {
  const { run, loading } = useAction()
  const [colour, setColour] = useState(null)
  const [addon, setAddon] = useState(null)
  const [placement, setPlacement] = useState(null)
  const p = product.personalisation
  const [pers, setPers] = useState({
    label_i18n: p?.label_i18n || { en: 'Name to print' }, help_i18n: p?.help_i18n || {}, min_length: p?.min_length ?? 1, max_length: p?.max_length ?? 20,
    allowed_pattern: p?.allowed_pattern || 'A-Za-z0-9 .\\-&', price_paise: p?.price_paise ?? 0, is_required: p?.is_required ?? false,
  })

  const toggleProduct = async (key, value) => { if (await run(UPDATE_PRODUCT, { id: product.id, input: { [key]: value } }, { silent: true })) refetch() }
  const toggleOption = (kind) => async (row, isActive) => { if (await run(SET_OPTION_ACTIVE, { productId: product.id, kind, id: row.id, isActive }, { silent: true })) refetch() }
  const saveWith = (mutation, draft, close, success) => async () => {
    if (await run(mutation, { productId: product.id, input: draft }, { success })) { close(null); refetch() }
  }
  const addonName = (id) => en(product.addons.find((a) => a.id === id)?.name_i18n) || '?'
  const master = product.customisation_enabled

  return (
    <>
      <Section title="Switches" subtitle="Turn on only what the factory can actually build. Customers never see options that are switched off.">
        <Stack>
          <FormControlLabel control={<Switch checked={master} disabled={!canWrite} onChange={(e) => toggleProduct('customisation_enabled', e.target.checked)} />} label={<strong>Allow customisation for this product</strong>} />
          {[['colour_selection_enabled', 'Colour choice'], ['addons_enabled', 'Add-ons & modifications'], ['personalisation_enabled', 'Name / text personalisation']].map(([k, label]) => (
            <FormControlLabel key={k} sx={{ ml: 3 }} control={<Switch checked={product[k]} disabled={!canWrite || !master} onChange={(e) => toggleProduct(k, e.target.checked)} />} label={label} />
          ))}
        </Stack>
      </Section>

      <Section title="Colours" subtitle="Price change is added to the base price for that colour." action={canWrite && <Button startIcon={<Plus size={16} />} onClick={() => setColour({ code: '', name_i18n: { en: '' }, hex: '#1F4D2B', price_delta_paise: 0, is_default: product.colours.length === 0, preview_image_url: null })}>Add colour</Button>}>
        {!product.colour_selection_enabled && product.colours.length > 0 && <Alert severity="info" sx={{ mb: 1 }}>Colour choice is switched off — these are hidden.</Alert>}
        <OptionTable
          rows={product.colours} canWrite={canWrite} onEdit={setColour} onToggle={toggleOption('colour')} empty="No colours yet."
          columns={[
            { label: 'Colour', render: (c) => <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: c.hex, border: 1, borderColor: 'divider' }} /><span>{en(c.name_i18n)}</span>{c.is_default && <Chip size="small" label="Default" />}</Stack> },
            { label: 'Code', render: (c) => c.code },
            { label: 'Price change', render: (c) => signed(c.price_delta_paise) },
          ]}
        />
      </Section>

      <Section title="Add-ons & modifications" subtitle="Accessories, attachments, upgrades, spares and services. Rules stop impossible combinations." action={canWrite && <Button startIcon={<Plus size={16} />} onClick={() => setAddon({ code: '', addon_type: 'accessory', name_i18n: { en: '' }, description_i18n: {}, pricing_mode: 'fixed', price_paise: 0, min_qty: 1, max_qty: 1, is_required: false, changes_base_price: false, group_key: '', requires: [], excludes: [] })}>Add add-on</Button>}>
        <OptionTable
          rows={product.addons} canWrite={canWrite} onEdit={(a) => setAddon({ ...a, group_key: a.group_key || '' })} onToggle={toggleOption('addon')} empty="No add-ons yet."
          columns={[
            { label: 'Add-on', render: (a) => <><strong>{en(a.name_i18n)}</strong> <Typography variant="caption" color="text.secondary">{a.code}</Typography></> },
            { label: 'Type', render: (a) => humanize(a.addon_type) },
            { label: 'Price', render: (a) => (a.pricing_mode === 'on_request' ? 'On request' : `${formatPaise(a.price_paise)}${a.pricing_mode === 'per_unit' ? ' each' : ''}`) },
            { label: 'Rules', render: (a) => [...a.requires.map((x) => `needs ${addonName(x)}`), ...a.excludes.map((x) => `not with ${addonName(x)}`), a.is_required && 'required'].filter(Boolean).join(' · ') || '—' },
          ]}
        />
      </Section>

      <Section title="Personalisation" subtitle="Customers type a short text (e.g. a name) printed at an admin-defined position.">
        <Stack spacing={2}>
          <I18nField label="Field label" value={pers.label_i18n} onChange={(v) => setPers({ ...pers, label_i18n: v })} requiredEn />
          <I18nField label="Help text" value={pers.help_i18n} onChange={(v) => setPers({ ...pers, help_i18n: v })} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={2}><TextField fullWidth size="small" type="number" label="Min length" value={pers.min_length} onChange={(e) => setPers({ ...pers, min_length: Number(e.target.value) })} disabled={!canWrite} /></Grid>
            <Grid item xs={6} md={2}><TextField fullWidth size="small" type="number" label="Max length" value={pers.max_length} onChange={(e) => setPers({ ...pers, max_length: Number(e.target.value) })} disabled={!canWrite} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Allowed characters" value={pers.allowed_pattern} onChange={(e) => setPers({ ...pers, allowed_pattern: e.target.value })} disabled={!canWrite} helperText="Character-class body, e.g. A-Za-z0-9 .\-&" /></Grid>
            <Grid item xs={6} md={2}><MoneyField label="Price" paise={pers.price_paise} onChange={(v) => setPers({ ...pers, price_paise: v ?? 0 })} disabled={!canWrite} /></Grid>
            <Grid item xs={6} md={2}><FormControlLabel control={<Switch checked={pers.is_required} onChange={(e) => setPers({ ...pers, is_required: e.target.checked })} disabled={!canWrite} />} label="Required" /></Grid>
          </Grid>
          {canWrite && <SaveBar onSave={async () => { if (await run(SAVE_PERSONALISATION, { productId: product.id, input: pers }, { success: 'Personalisation saved' })) refetch() }} loading={loading} label="Save personalisation" />}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Placements</Typography>
            {canWrite && <Button size="small" startIcon={<Plus size={14} />} onClick={() => setPlacement({ code: '', name_i18n: { en: '' }, price_delta_paise: 0, preview_image_url: null })}>Add placement</Button>}
          </Stack>
          <OptionTable
            rows={product.placements} canWrite={canWrite} onEdit={setPlacement} onToggle={toggleOption('placement')} empty="No placements — the factory will choose the position."
            columns={[{ label: 'Placement', render: (x) => en(x.name_i18n) }, { label: 'Code', render: (x) => x.code }, { label: 'Price change', render: (x) => signed(x.price_delta_paise) }]}
          />
        </Box>
      </Section>

      <OptionPanel title={colour?.id ? 'Edit colour' : 'New colour'} draft={colour} setDraft={setColour} onClose={() => setColour(null)} loading={loading}
        onSave={saveWith(SAVE_COLOUR, colour, setColour, 'Colour saved')}>
        {(d, patch) => (
          <>
            <I18nField label="Colour name" value={d.name_i18n} onChange={(v) => patch({ name_i18n: v })} requiredEn />
            <Stack direction="row" spacing={2}>
              <TextField size="small" label="Code" value={d.code} onChange={(e) => patch({ code: e.target.value })} helperText="e.g. RED" />
              <TextField size="small" type="color" label="Swatch" value={d.hex} onChange={(e) => patch({ hex: e.target.value })} sx={{ width: 100 }} />
              <TextField size="small" label="Hex" value={d.hex} onChange={(e) => patch({ hex: e.target.value })} sx={{ width: 120 }} />
            </Stack>
            <MoneyField label="Price change (can be negative)" paise={d.price_delta_paise} onChange={(v) => patch({ price_delta_paise: v ?? 0 })} inputProps={{ step: '0.01' }} />
            <FormControlLabel control={<Switch checked={Boolean(d.is_default)} onChange={(e) => patch({ is_default: e.target.checked })} />} label="Default colour" />
            <ImageUpload productId={product.id} value={d.preview_image_url} onChange={(url) => patch({ preview_image_url: url })} />
          </>
        )}
      </OptionPanel>

      <OptionPanel title={addon?.id ? 'Edit add-on' : 'New add-on'} draft={addon} setDraft={setAddon} onClose={() => setAddon(null)} loading={loading}
        onSave={saveWith(SAVE_ADDON, addon && { ...addon, group_key: addon.group_key || null }, setAddon, 'Add-on saved')}>
        {(d, patch) => {
          const others = product.addons.filter((a) => a.id !== d.id)
          const pick = (key) => (
            <Autocomplete multiple options={others.map((a) => a.id)} getOptionLabel={addonName} value={d[key] || []} onChange={(_e, v) => patch({ [key]: v })}
              renderInput={(params) => <TextField {...params} size="small" label={key === 'requires' ? 'Requires (must also be selected)' : 'Cannot be combined with'} />} />
          )
          return (
            <>
              <I18nField label="Name" value={d.name_i18n} onChange={(v) => patch({ name_i18n: v })} requiredEn />
              <I18nField label="Description" value={d.description_i18n} onChange={(v) => patch({ description_i18n: v })} multiline />
              <Stack direction="row" spacing={2}>
                <TextField size="small" label="Code" value={d.code} onChange={(e) => patch({ code: e.target.value })} />
                <TextField select size="small" label="Type" value={d.addon_type} onChange={(e) => patch({ addon_type: e.target.value })} sx={{ minWidth: 150 }}>
                  {ADDON_TYPES.map((t) => <MenuItem key={t} value={t}>{humanize(t)}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Group" value={d.group_key} onChange={(e) => patch({ group_key: e.target.value })} helperText="Optional heading" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField select size="small" label="Pricing" value={d.pricing_mode} onChange={(e) => patch({ pricing_mode: e.target.value })} sx={{ minWidth: 150 }}>
                  <MenuItem value="fixed">Fixed</MenuItem><MenuItem value="per_unit">Per unit</MenuItem><MenuItem value="on_request">On request</MenuItem>
                </TextField>
                <MoneyField label="Price" paise={d.price_paise} onChange={(v) => patch({ price_paise: v ?? 0 })} disabled={d.pricing_mode === 'on_request'} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField size="small" type="number" label="Min qty" value={d.min_qty} onChange={(e) => patch({ min_qty: Number(e.target.value) })} />
                <TextField size="small" type="number" label="Max qty" value={d.max_qty} onChange={(e) => patch({ max_qty: Number(e.target.value) })} />
              </Stack>
              <FormControlLabel control={<Switch checked={Boolean(d.is_required)} onChange={(e) => patch({ is_required: e.target.checked })} />} label="Always included (required)" />
              <FormControlLabel control={<Switch checked={Boolean(d.changes_base_price)} onChange={(e) => patch({ changes_base_price: e.target.checked })} />} label="Replaces a standard component (upgrade)" />
              {others.length > 0 && pick('requires')}
              {others.length > 0 && pick('excludes')}
              <ImageUpload productId={product.id} value={d.image_url} onChange={(url) => patch({ image_url: url })} label="Image" />
              <ImageUpload productId={product.id} value={d.diagram_url} onChange={(url) => patch({ diagram_url: url })} label="Diagram" />
            </>
          )
        }}
      </OptionPanel>

      <OptionPanel title={placement?.id ? 'Edit placement' : 'New placement'} draft={placement} setDraft={setPlacement} onClose={() => setPlacement(null)} loading={loading}
        onSave={saveWith(SAVE_PLACEMENT, placement, setPlacement, 'Placement saved')}>
        {(d, patch) => (
          <>
            <I18nField label="Placement name" value={d.name_i18n} onChange={(v) => patch({ name_i18n: v })} requiredEn />
            <TextField size="small" label="Code" value={d.code} onChange={(e) => patch({ code: e.target.value })} helperText="e.g. FRONT_PANEL" />
            <MoneyField label="Price change" paise={d.price_delta_paise} onChange={(v) => patch({ price_delta_paise: v ?? 0 })} />
            <ImageUpload productId={product.id} value={d.preview_image_url} onChange={(url) => patch({ preview_image_url: url })} />
          </>
        )}
      </OptionPanel>
    </>
  )
}

export default CustomisationTab
