/**
 * Site settings & tax (§14.6, §22.1). Settings are stored per section and
 * merged over server defaults, so the form is generated from the values:
 * `*_i18n` → English/Hindi pair, booleans → switch, `*_url` → upload,
 * lists / nested objects → JSON editor.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import { Plus } from 'lucide-react'

import { CustomTable, ErrorState, LoadingState, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { I18nField, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { SETTINGS, UPDATE_SETTINGS, UPLOAD_BRAND_ASSET, TAX_RULES, SAVE_TAX_RULE } from '@/services/admin.api'
import { mediaUrl } from '@/services/files'
import { bpsToPercent, percentToBps } from '@/utils/money'

const SECTIONS = {
  business: { label: 'Business', help: 'Shown in the footer, on quotations and catalogues. State decides CGST+SGST vs IGST.' },
  commerce: { label: 'Enquiries & orders', help: 'How enquiries behave and what customers agree to.' },
  quotation: { label: 'Quotations', help: 'Defaults for every new quotation and the PDF layout.' },
  catalogue: { label: 'Catalogue PDF', help: 'Cover text for generated catalogues.' },
  home: { label: 'Home page', help: 'Hero banner and benefit tiles.' },
  seo: { label: 'SEO', help: 'Fallback titles and descriptions.' },
  features: { label: 'Features', help: 'Switch website features on or off.' },
  social: { label: 'Social links', help: 'Shown in the footer.' },
  email_templates: { label: 'Email templates', help: 'Overrides for notification emails, keyed by event (e.g. quotation_sent). Leave {} to use built-in templates.' },
}
const SELECTS = {
  'commerce.tax_display': ['exclusive', 'inclusive'],
  'commerce.default_language': ['en', 'hi'],
  'commerce.units': ['metric'],
  'commerce.currency': ['INR'],
}
const LONG_TEXT = /terms|consent|intro|subtitle|description|address/

const Field = ({ section, name, value, onChange, disabled }) => {
  const { run, loading } = useAction()
  const label = humanize(name.replace(/_i18n$/, '').replace(/_url$/, ' image'))
  const [jsonText, setJsonText] = useState(() => (typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : ''))
  const [jsonError, setJsonError] = useState(null)

  if (name.endsWith('_i18n')) return <I18nField label={label} value={value || {}} onChange={onChange} multiline={LONG_TEXT.test(name)} rows={name.startsWith('terms') ? 5 : 2} />
  if (typeof value === 'boolean') return <FormControlLabel control={<Switch checked={value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />} label={label} />
  if (typeof value === 'number') return <TextField fullWidth size="small" type="number" label={label} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
  if (SELECTS[`${section}.${name}`]) {
    return <TextField select fullWidth size="small" label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>{SELECTS[`${section}.${name}`].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField>
  }
  if (name.endsWith('_url') && /image|logo|og/.test(name)) {
    return (
      <Stack direction="row" spacing={1.5} alignItems="center">
        {value && <Box component="img" src={mediaUrl(value)} alt="" sx={{ width: 64, height: 48, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 1 }} />}
        <TextField fullWidth size="small" label={label} value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value || null)} />
        <Button component="label" variant="outlined" disabled={disabled || loading}>Upload
          <input hidden type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            const res = file && await run(UPLOAD_BRAND_ASSET, { file }, { silent: true })
            if (res?.url) onChange(res.url)
          }} />
        </Button>
      </Stack>
    )
  }
  if (value !== null && typeof value === 'object') {
    return (
      <TextField fullWidth size="small" multiline minRows={4} label={`${label} (JSON)`} value={jsonText} disabled={disabled} error={Boolean(jsonError)} helperText={jsonError || 'Edit carefully — must be valid JSON'}
        InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
        onChange={(e) => {
          setJsonText(e.target.value)
          try { onChange(JSON.parse(e.target.value)); setJsonError(null) } catch { setJsonError('Invalid JSON — not saved until fixed') }
        }} />
    )
  }
  return <TextField fullWidth size="small" label={label} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} multiline={LONG_TEXT.test(name)} />
}

const SectionForm = ({ section, initial, canWrite, onSaved }) => {
  const [value, setValue] = useState(initial)
  const { run, loading } = useAction()
  const isJsonSection = section === 'email_templates'
  const entries = Object.entries(value || {})
  const wide = (k, v) => k.endsWith('_i18n') || (v !== null && typeof v === 'object') || k.endsWith('_url')
  return (
    <>
      {isJsonSection ? <Field section={section} name="templates" value={value} onChange={setValue} disabled={!canWrite} /> : (
        <Grid container spacing={2}>
          {entries.map(([k, v]) => (
            <Grid item xs={12} md={wide(k, v) ? 12 : typeof v === 'boolean' ? 6 : 4} key={k}>
              <Field section={section} name={k} value={v} disabled={!canWrite} onChange={(nv) => setValue((cur) => ({ ...cur, [k]: nv }))} />
            </Grid>
          ))}
        </Grid>
      )}
      {canWrite && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="contained" disabled={loading} onClick={async () => { if (await run(UPDATE_SETTINGS, { section, value }, { success: `${SECTIONS[section].label} saved` })) onSaved() }}>Save {SECTIONS[section].label.toLowerCase()}</Button>
        </Stack>
      )}
    </>
  )
}

const TaxRules = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:pricing:write')
  const { data, error, refetch } = useQuery(TAX_RULES, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [draft, setDraft] = useState(null)
  if (error) return <ErrorState message={error.message} />
  const columns = [
    { id: 'name', label: 'Name', format: (v, r) => <><strong>{v}</strong>{r.is_default ? ' (default)' : ''}</> },
    { id: 'hsn_code', label: 'HSN', format: (v) => v || '—' },
    { id: 'rate_bps', label: 'GST rate', align: 'right', format: (v) => `${bpsToPercent(v)}%` },
    { id: 'tax_type', label: 'Type' },
    { id: 'applies_to_addons', label: 'On add-ons', format: (v) => (v ? 'Yes' : 'No') },
    { id: 'is_active', label: 'Active', format: (v) => (v ? 'Yes' : 'No') },
  ]
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">Products use their own rule or the default. Quotations split GST into CGST + SGST (same state) or IGST (other state).</Typography>
        {canWrite && <Button startIcon={<Plus size={16} />} onClick={() => setDraft({ name: '', hsn_code: '', rate_bps: 1200, tax_type: 'GST', applies_to_addons: true, is_default: false, is_active: true })}>Add rule</Button>}
      </Stack>
      <CustomTable tableId="tax-rules" columns={columns} rows={data?.taxRules || []} onRowClick={canWrite ? (r) => setDraft({ ...r }) : undefined} />
      <SidebarPanel open={Boolean(draft)} onClose={() => setDraft(null)} title={draft?.id ? 'Edit tax rule' : 'New tax rule'} loading={loading}
        onSave={async () => {
          const { id, name, hsn_code, rate_bps, tax_type, applies_to_addons, is_default, is_active } = draft
          if (await run(SAVE_TAX_RULE, { id: id || null, input: { name, hsn_code: hsn_code || null, rate_bps, tax_type, applies_to_addons, is_default, is_active } })) { setDraft(null); refetch() }
        }}>
        {draft && (
          <Stack spacing={2}>
            <Alert severity="warning">Check rates and HSN codes with your tax advisor. Changes apply to new quotations only.</Alert>
            <TextField size="small" label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Agricultural machinery 12%" />
            <TextField size="small" label="HSN code" value={draft.hsn_code || ''} onChange={(e) => setDraft({ ...draft, hsn_code: e.target.value })} />
            <TextField size="small" type="number" label="Rate (%)" value={bpsToPercent(draft.rate_bps)} onChange={(e) => setDraft({ ...draft, rate_bps: percentToBps(e.target.value) ?? 0 })} />
            <TextField select size="small" label="Type" value={draft.tax_type} onChange={(e) => setDraft({ ...draft, tax_type: e.target.value })}>
              <MenuItem value="GST">GST</MenuItem><MenuItem value="NONE">No tax</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch checked={draft.applies_to_addons} onChange={(e) => setDraft({ ...draft, applies_to_addons: e.target.checked })} />} label="Also applies to add-ons" />
            <FormControlLabel control={<Switch checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} />} label="Default rule" />
            <FormControlLabel control={<Switch checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />} label="Active" />
          </Stack>
        )}
      </SidebarPanel>
    </>
  )
}

const Settings = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:settings:write')
  const { data, loading, error, refetch } = useQuery(SETTINGS, { fetchPolicy: 'cache-and-network' })
  const [tab, setTab] = useState('business')
  if (loading && !data) return <LoadingState />
  if (error) return <ErrorState message={error.message} />
  const settings = data?.settings || {}
  return (
    <PageContainer>
      <PageHeader title="Settings & tax" subtitle="Business details, quotation defaults, website content blocks and GST rules" />
      <Card variant="outlined">
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          {Object.entries(SECTIONS).map(([k, s]) => <Tab key={k} value={k} label={s.label} />)}
          {hasPermission('admin:pricing:read') && <Tab value="tax" label="Tax rules" />}
        </Tabs>
        <CardContent>
          {tab === 'tax' ? <TaxRules /> : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{SECTIONS[tab].help}</Typography>
              {!canWrite && <Alert severity="info" sx={{ mb: 2 }}>Only members with settings write access (Super Admin by default) can change these.</Alert>}
              <SectionForm key={`${tab}-${JSON.stringify(settings[tab]).length}`} section={tab} initial={settings[tab] || {}} canWrite={canWrite} onSaved={refetch} />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}

export default Settings
