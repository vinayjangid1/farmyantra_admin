import { useState } from 'react'
import { Alert, Grid, Tab, Tabs, TextField } from '@mui/material'

import { useAction } from '@/shared/hooks/useAction'
import { SAVE_TRANSLATION } from '@/services/admin.api'
import { Section, SaveBar, linesToList, listToLines } from './shared'

const FIELDS = [
  ['name', 'Product name', { required: true }],
  ['short_description', 'Short description', { multiline: true, minRows: 2, helperText: 'One or two sentences for cards and search results' }],
  ['description', 'Full description', { multiline: true, minRows: 6 }],
  ['key_benefits', 'Key benefits', { multiline: true, minRows: 4, helperText: 'One benefit per line (up to 12)' }],
  ['intended_use_text', 'Suitable for', { multiline: true, minRows: 2 }],
  ['included_accessories', 'In the box', { multiline: true, minRows: 3, helperText: 'One item per line' }],
  ['warranty_text', 'Warranty', { multiline: true, minRows: 2 }],
  ['service_text', 'Service & support', { multiline: true, minRows: 2 }],
  ['lead_time_text', 'Delivery / lead time note', {}],
  ['seo_title', 'SEO title', { helperText: 'Up to 200 characters' }],
  ['seo_description', 'SEO description', { multiline: true, minRows: 2, helperText: 'Up to 320 characters' }],
]
const LIST_FIELDS = ['key_benefits', 'included_accessories']

const LanguageForm = ({ product, language, refetch, canWrite }) => {
  const existing = product.translations.find((t) => t.language === language) || {}
  const english = product.translations.find((t) => t.language === 'en') || {}
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(([k]) => [k, LIST_FIELDS.includes(k) ? listToLines(existing[k]) : existing[k] || ''])))
  const { run, loading } = useAction()
  const save = async () => {
    const input = { ...form, ...Object.fromEntries(LIST_FIELDS.map((k) => [k, linesToList(form[k])])) }
    if (await run(SAVE_TRANSLATION, { productId: product.id, language, input }, { success: `${language === 'hi' ? 'Hindi' : 'English'} text saved` })) refetch()
  }
  return (
    <>
      {language === 'hi' && !existing.name && <Alert severity="info" sx={{ mb: 2 }}>No Hindi text yet — Hindi visitors see English. English text is shown under each field as a reference.</Alert>}
      <Grid container spacing={2}>
        {FIELDS.map(([key, label, props]) => (
          <Grid item xs={12} md={props.multiline && props.minRows > 3 ? 12 : 6} key={key}>
            <TextField
              fullWidth size="small" label={label} value={form[key]} disabled={!canWrite} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              {...props}
              helperText={language === 'hi' && english[key] ? `EN: ${String(LIST_FIELDS.includes(key) ? listToLines(english[key]).replace(/\n/g, ' · ') : english[key]).slice(0, 140)}` : props.helperText}
              inputProps={{ lang: language }}
            />
          </Grid>
        ))}
      </Grid>
      {canWrite && <SaveBar onSave={save} loading={loading} disabled={!form.name.trim()} label={`Save ${language === 'hi' ? 'Hindi' : 'English'}`} />}
    </>
  )
}

const TranslationsTab = (props) => {
  const [language, setLanguage] = useState('en')
  return (
    <Section title="Customer-facing text" subtitle="English is required and is the fallback. Hindi is optional per field.">
      <Tabs value={language} onChange={(_e, v) => setLanguage(v)} sx={{ mb: 2 }}>
        <Tab value="en" label="English" />
        <Tab value="hi" label="हिंदी (Hindi)" />
      </Tabs>
      <LanguageForm key={language} language={language} {...props} />
    </Section>
  )
}

export default TranslationsTab
