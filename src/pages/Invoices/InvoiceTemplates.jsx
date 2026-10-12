/** Invoice templates: colours, logo, columns, bank details, terms, signatory — with a live PDF preview. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material'
import { Eye, Plus } from 'lucide-react'

import { SidebarPanel } from '@/shared/components'
import { humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { apolloClient } from '@/lib/graphql/client'
import { showToast } from '@/lib/toast'
import { INVOICE_TEMPLATES, SAVE_INVOICE_TEMPLATE, INVOICE_TEMPLATE_PREVIEW, UPLOAD_BRAND_ASSET } from '@/services/admin.api'
import { openBase64Pdf, mediaUrl } from '@/services/files'

const SWITCHES = ['show_logo', 'show_hsn', 'show_sku', 'show_discount_column', 'show_tax_summary', 'show_amount_in_words', 'show_bank_details']
const TYPES = ['tax_invoice', 'proforma_invoice', 'credit_note']

const ImageField = ({ label, value, onChange }) => {
  const { run, loading } = useAction()
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {value && <Box component="img" src={mediaUrl(value)} alt="" sx={{ width: 72, height: 40, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 1 }} />}
      <Button component="label" size="small" variant="outlined" disabled={loading}>{value ? `Change ${label}` : `Upload ${label}`}
        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          const res = file && await run(UPLOAD_BRAND_ASSET, { file }, { silent: true })
          if (res?.url) onChange(res.url)
        }} />
      </Button>
      {value && <Button size="small" onClick={() => onChange(null)}>Remove</Button>}
    </Stack>
  )
}

const InvoiceTemplates = ({ canWrite }) => {
  const { data, refetch } = useQuery(INVOICE_TEMPLATES, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const L = edit?.layout
  const setL = (patch) => setEdit({ ...edit, layout: { ...edit.layout, ...patch } })
  const preview = async () => {
    setPreviewing(true)
    try {
      const res = await apolloClient.query({ query: INVOICE_TEMPLATE_PREVIEW, variables: { layout: L }, fetchPolicy: 'network-only' })
      openBase64Pdf(res.data.invoiceTemplatePreview)
    } catch (e) {
      showToast(e.message, { severity: 'error' })
    } finally {
      setPreviewing(false)
    }
  }
  const templates = data?.invoiceTemplates || []
  return (
    <Box>
      {canWrite && templates.length > 0 && (
        <Button variant="contained" startIcon={<Plus size={16} />} sx={{ mb: 2 }} onClick={() => setEdit({ name: 'New template', document_types: TYPES, is_default: false, is_active: true, layout: templates[0].layout })}>New template</Button>
      )}
      <Grid container spacing={2}>
        {templates.map((t) => (
          <Grid item xs={12} sm={6} lg={4} key={t.id}>
            <Card variant="outlined" sx={{ borderTop: 6, borderTopColor: t.layout.accent_color }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, flex: 1 }}>{t.name}</Typography>
                  {t.is_default && <Chip size="small" color="success" label="Default" />}
                  {!t.is_active && <Chip size="small" label="Inactive" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">{t.document_types.map(humanize).join(' · ')}</Typography>
                <Typography variant="caption" color="text.secondary">Used on {t.invoice_count} invoice(s)</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button size="small" variant="outlined" onClick={() => setEdit(t)}>{canWrite ? 'Edit' : 'View'}</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? `Template: ${edit.name}` : 'New template'} loading={loading}
        onSave={canWrite ? async () => { if (await run(SAVE_INVOICE_TEMPLATE, { id: edit.id || null, input: edit })) { setEdit(null); refetch() } } : undefined}
        headerActions={<Button size="small" startIcon={<Eye size={16} />} disabled={previewing} onClick={preview}>Preview PDF</Button>}>
        {edit && (
          <Stack spacing={2}>
            <TextField size="small" label="Template name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {TYPES.map((t) => (
                <Chip key={t} label={humanize(t)} color={edit.document_types.includes(t) ? 'primary' : 'default'}
                  onClick={() => setEdit({ ...edit, document_types: edit.document_types.includes(t) ? edit.document_types.filter((x) => x !== t) : [...edit.document_types, t] })} />
              ))}
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControlLabel control={<Switch checked={Boolean(edit.is_default)} onChange={(e) => setEdit({ ...edit, is_default: e.target.checked })} />} label="Default" />
              <FormControlLabel control={<Switch checked={edit.is_active !== false} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />} label="Active" />
            </Stack>
            <Typography variant="subtitle2">Look</Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField size="small" type="color" label="Accent colour" value={L.accent_color} onChange={(e) => setL({ accent_color: e.target.value })} sx={{ width: 140 }} />
              <TextField size="small" type="number" label="Font size" inputProps={{ step: 0.5, min: 7, max: 11 }} value={L.font_size} onChange={(e) => setL({ font_size: Number(e.target.value) })} sx={{ width: 120 }} />
            </Stack>
            <ImageField label="logo" value={L.logo_url} onChange={(v) => setL({ logo_url: v })} />
            <Grid container spacing={1}>
              {SWITCHES.map((k) => (
                <Grid item xs={6} key={k}><FormControlLabel control={<Switch size="small" checked={Boolean(L[k])} onChange={(e) => setL({ [k]: e.target.checked })} />} label={humanize(k.replace(/^show_/, ''))} /></Grid>
              ))}
            </Grid>
            <Typography variant="subtitle2">Titles</Typography>
            <Grid container spacing={1}>
              {TYPES.map((t) => <Grid item xs={12} sm={4} key={t}><TextField fullWidth size="small" label={humanize(t)} value={L.titles[t]} onChange={(e) => setL({ titles: { ...L.titles, [t]: e.target.value } })} /></Grid>)}
            </Grid>
            <TextField size="small" label="Copy label" value={L.copy_label} onChange={(e) => setL({ copy_label: e.target.value })} helperText="e.g. ORIGINAL FOR RECIPIENT" />
            <TextField size="small" label="Header note" value={L.header_note} onChange={(e) => setL({ header_note: e.target.value })} />
            <Typography variant="subtitle2">Bank details (printed for offline payment)</Typography>
            <Grid container spacing={1}>
              {['account_name', 'account_number', 'ifsc', 'bank_name', 'branch', 'upi_id'].map((k) => (
                <Grid item xs={6} key={k}><TextField fullWidth size="small" label={humanize(k)} value={L.bank[k] || ''} onChange={(e) => setL({ bank: { ...L.bank, [k]: e.target.value } })} /></Grid>
              ))}
            </Grid>
            <TextField size="small" multiline minRows={2} label="Declaration" value={L.declaration} onChange={(e) => setL({ declaration: e.target.value })} />
            <TextField size="small" multiline minRows={3} label="Terms" value={L.terms} onChange={(e) => setL({ terms: e.target.value })} />
            <TextField size="small" label="Footer" value={L.footer} onChange={(e) => setL({ footer: e.target.value })} />
            <Grid container spacing={1}>
              <Grid item xs={6}><TextField fullWidth size="small" label="Signatory name" value={L.signatory_name} onChange={(e) => setL({ signatory_name: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Designation" value={L.signatory_designation} onChange={(e) => setL({ signatory_designation: e.target.value })} /></Grid>
            </Grid>
            <ImageField label="signature" value={L.signature_image_url} onChange={(v) => setL({ signature_image_url: v })} />
          </Stack>
        )}
      </SidebarPanel>
    </Box>
  )
}

export default InvoiceTemplates
