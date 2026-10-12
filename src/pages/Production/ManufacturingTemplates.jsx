/** Production stage templates (§26.1): product → category → default. */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Alert, Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

import { PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { I18nField, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { MANUFACTURING_TEMPLATES, SAVE_MANUFACTURING_TEMPLATE } from '@/services/admin.api'
import { en } from '@/features/fulfilment/utils'

const ManufacturingTemplates = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:manufacturing:write')
  const { data, refetch } = useQuery(MANUFACTURING_TEMPLATES, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  const stages = edit?.stages || []
  const setStages = (next) => setEdit({ ...edit, stages: next })
  const move = (i, d) => { const s = [...stages]; [s[i], s[i + d]] = [s[i + d], s[i]]; setStages(s) }
  return (
    <PageContainer>
      <PageHeader title="Production stages" subtitle="Stages every made-to-order job goes through. Assign a template to a product or category; others use the default." />
      {canWrite && <Button variant="contained" startIcon={<Plus size={16} />} sx={{ mb: 2 }} onClick={() => setEdit({ name: '', scope: 'product', is_active: true, stages: [{ name_i18n: { en: '' }, planned_days: 1, customer_visible_default: true }] })}>New template</Button>}
      <Grid container spacing={2}>
        {(data?.manufacturingTemplates || []).map((t) => (
          <Grid item xs={12} md={6} lg={4} key={t.id}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, flex: 1 }}>{t.name}</Typography>
                  <Chip size="small" label={humanize(t.scope)} color={t.scope === 'default' ? 'success' : 'default'} />
                </Stack>
                <Typography variant="caption" color="text.secondary">{t.stages.length} stages · about {t.total_planned_days} days · {t.product_count} products, {t.category_count} categories</Typography>
                <Box component="ol" sx={{ pl: 2.5, my: 1 }}>{t.stages.map((s) => <li key={s.id}><Typography variant="body2">{en(s.name_i18n)} <Typography component="span" variant="caption" color="text.secondary">({s.planned_days}d{s.customer_visible_default ? '' : ', internal'})</Typography></Typography></li>)}</Box>
                <Button size="small" onClick={() => setEdit(t)}>{canWrite ? 'Edit' : 'View'}</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.name}` : 'New template'} loading={loading}
        onSave={canWrite ? async () => { if (await run(SAVE_MANUFACTURING_TEMPLATE, { id: edit.id || null, input: edit })) { setEdit(null); refetch() } } : undefined}>
        {edit && (
          <Stack spacing={2}>
            <TextField size="small" label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <TextField select size="small" label="Used for" value={edit.scope} onChange={(e) => setEdit({ ...edit, scope: e.target.value })}>
              <MenuItem value="product">Products (pick on the product&apos;s Stock &amp; lead time tab)</MenuItem>
              <MenuItem value="category">Categories (pick on the category)</MenuItem>
              <MenuItem value="default">Default for everything else</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch checked={edit.is_active !== false} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />} label="Active" />
            <Alert severity="info">Changes apply to new jobs. Jobs already running keep their stages.</Alert>
            {stages.map((s, i) => (
              <Card key={i} variant="outlined"><CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>Stage {i + 1}</Typography>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={16} /></IconButton>
                  <IconButton size="small" disabled={i === stages.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={16} /></IconButton>
                  <IconButton size="small" disabled={stages.length === 1} onClick={() => setStages(stages.filter((_x, j) => j !== i))} aria-label="Remove"><Trash2 size={16} /></IconButton>
                </Stack>
                <I18nField label="Stage name" value={s.name_i18n} onChange={(v) => setStages(stages.map((x, j) => (j === i ? { ...x, name_i18n: v } : x)))} requiredEn />
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} alignItems="center">
                  <TextField size="small" type="number" label="Planned days" sx={{ width: 140 }} value={s.planned_days} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, planned_days: Number(e.target.value) } : x)))} />
                  <FormControlLabel control={<Switch checked={s.customer_visible_default !== false} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, customer_visible_default: e.target.checked } : x)))} />} label="Show to customer" />
                </Stack>
              </CardContent></Card>
            ))}
            <Button startIcon={<Plus size={16} />} onClick={() => setStages([...stages, { name_i18n: { en: '' }, planned_days: 1, customer_visible_default: true }])}>Add stage</Button>
          </Stack>
        )}
      </SidebarPanel>
    </PageContainer>
  )
}

export default ManufacturingTemplates
