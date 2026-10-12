/**
 * Product editor (§14.2). One page, one tab per concern, each saved on its
 * own so a translator never touches prices and a pricing change can carry
 * its own audit reason. Tabs the member cannot write are read-only.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Card, Link, Stack, Tab, Tabs, Typography } from '@mui/material'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'

import { ConfirmDialog, ErrorState, LoadingState, PageContainer } from '@/shared/components'
import { StatusChip, en } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { PRODUCT, CATEGORIES, SET_PRODUCT_STATUS, DUPLICATE_PRODUCT } from '@/services/admin.api'
import { WEBSITE_URL } from '@/core/config/env'

import DetailsTab from './editor/DetailsTab'
import PricingTab from './editor/PricingTab'
import TranslationsTab from './editor/TranslationsTab'
import SpecsTab from './editor/SpecsTab'
import MediaTab from './editor/MediaTab'
import CustomisationTab from './editor/CustomisationTab'
import RelatedTab from './editor/RelatedTab'

const TABS = [
  { key: 'details', label: 'Details', Component: DetailsTab, perm: 'products' },
  { key: 'pricing', label: 'Pricing & tax', Component: PricingTab, perm: 'pricing' },
  { key: 'translations', label: 'English / हिंदी', Component: TranslationsTab, perm: 'product_translations' },
  { key: 'specs', label: 'Specifications', Component: SpecsTab, perm: 'products' },
  { key: 'media', label: 'Media, documents & 3D', Component: MediaTab, perm: 'products' },
  { key: 'customisation', label: 'Customisation', Component: CustomisationTab, perm: 'customisation' },
  { key: 'related', label: 'Related', Component: RelatedTab, perm: 'products' },
]

const ProductEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const [tab, setTab] = useState('details')
  const [confirm, setConfirm] = useState(null)
  const { data, loading, error, refetch } = useQuery(PRODUCT, { variables: { id }, fetchPolicy: 'cache-and-network' })
  const { data: catData } = useQuery(CATEGORIES)
  const { run, loading: busy } = useAction()

  const product = data?.product
  if (loading && !product) return <LoadingState message="Loading product…" />
  if (error) return <ErrorState title="Could not load product" message={error.message} />
  if (!product) return null

  const canWrite = (feature) => hasPermission(`admin:${feature}:write`)
  const name = product.translations.find((t) => t.language === 'en')?.name || product.sku
  const blocking = product.publish_issues.filter((i) => !i.includes('warning only'))
  const warnings = product.publish_issues.filter((i) => i.includes('warning only'))
  const active = TABS.find((t) => t.key === tab)
  const ctx = { product, categories: catData?.categories || [], refetch, canWrite: canWrite(active.perm) }

  const setStatus = async (status) => {
    if (await run(SET_PRODUCT_STATUS, { id, status })) refetch()
    setConfirm(null)
  }
  const duplicate = async () => {
    const copy = await run(DUPLICATE_PRODUCT, { id })
    if (copy?.id) navigate(`/products/${copy.id}`)
  }

  return (
    <PageContainer>
      <Button component={RouterLink} to="/products" startIcon={<ArrowLeft size={16} />} sx={{ mb: 1 }}>Products</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{name}</Typography>
            <StatusChip status={product.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            SKU {product.sku} · {en(ctx.categories.find((c) => c.id === product.category_id)?.name_i18n) || 'No category'}
            {product.status === 'published' && WEBSITE_URL && (
              <> · <Link href={`${WEBSITE_URL}/product/${product.slug}`} target="_blank" rel="noopener" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>View on website <ExternalLink size={12} /></Link></>
            )}
          </Typography>
        </Box>
        {canWrite('products') && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" startIcon={<Copy size={16} />} onClick={duplicate} disabled={busy}>Duplicate</Button>
            {product.status !== 'published' && <Button variant="contained" disabled={busy || blocking.length > 0} onClick={() => setStatus('published')}>Publish</Button>}
            {product.status === 'published' && <Button variant="outlined" color="warning" disabled={busy} onClick={() => setConfirm('draft')}>Unpublish</Button>}
            {product.status !== 'archived' && <Button color="error" disabled={busy} onClick={() => setConfirm('archived')}>Archive</Button>}
          </Stack>
        )}
      </Stack>

      {product.status !== 'published' && blocking.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Before publishing:</strong> {blocking.join(' · ')}
        </Alert>
      )}
      {warnings.length > 0 && <Alert severity="info" sx={{ mb: 2 }}>{warnings.map((w) => w.replace(' — warning only', '')).join(' · ')}</Alert>}

      <Card variant="outlined">
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {!ctx.canWrite && <Alert severity="info" sx={{ mb: 2 }}>You can view this section but not change it.</Alert>}
          <active.Component key={`${tab}-${product.updated_at}`} {...ctx} />
        </Box>
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => setStatus(confirm)} loading={busy} severity="warning"
        title={confirm === 'archived' ? 'Archive product?' : 'Unpublish product?'}
        message={confirm === 'archived' ? 'Archived products disappear from the website but stay on existing enquiries, quotations and orders.' : 'The product will be hidden from the website until it is published again.'}
        confirmLabel={confirm === 'archived' ? 'Archive' : 'Unpublish'}
      />
    </PageContainer>
  )
}

export default ProductEditor
