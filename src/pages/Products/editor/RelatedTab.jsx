import { useMemo, useState } from 'react'
import { useQuery } from '@apollo/client'
import { Autocomplete, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { Trash2 } from 'lucide-react'

import { useAction } from '@/shared/hooks/useAction'
import { PRODUCTS, SAVE_RELATIONS } from '@/services/admin.api'
import { useDebounce } from '@/shared/hooks'
import { Section, SaveBar } from './shared'

const TYPES = { related: 'Related', accessory: 'Accessory / goes with', alternative: 'Alternative' }

const RelatedTab = ({ product, refetch, canWrite }) => {
  const [relations, setRelations] = useState(product.relations)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const { data } = useQuery(PRODUCTS, { variables: { search: debounced || undefined, limit: 20, page: 1 } })
  const { data: allData } = useQuery(PRODUCTS, { variables: { limit: 100, page: 1 } })
  const names = useMemo(() => new Map([...(allData?.products?.items || []), ...(data?.products?.items || [])].map((p) => [p.id, `${p.name} (${p.sku})`])), [allData, data])
  const options = (data?.products?.items || []).filter((p) => p.id !== product.id && !relations.some((r) => r.related_product_id === p.id))
  const { run, loading } = useAction()
  return (
    <Section title="Related products" subtitle="Shown under “You may also need” and “Alternatives” on the product page (max 24).">
      {relations.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>None yet.</Typography>}
      {relations.map((r, i) => (
        <Stack key={`${r.related_product_id}-${r.relation_type}`} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 700 }}>{names.get(r.related_product_id) || r.related_product_id}</Typography>
          <TextField select size="small" value={r.relation_type} disabled={!canWrite} onChange={(e) => setRelations((rs) => rs.map((x, idx) => (idx === i ? { ...x, relation_type: e.target.value } : x)))} sx={{ minWidth: 200 }}>
            {Object.entries(TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          {canWrite && <IconButton color="error" onClick={() => setRelations((rs) => rs.filter((_x, idx) => idx !== i))}><Trash2 size={16} /></IconButton>}
        </Stack>
      ))}
      {canWrite && (
        <>
          <Autocomplete
            options={options} getOptionLabel={(p) => `${p.name} (${p.sku})`} onInputChange={(_e, v) => setSearch(v)} value={null}
            onChange={(_e, p) => p && setRelations((rs) => [...rs, { related_product_id: p.id, relation_type: 'related' }])}
            renderInput={(params) => <TextField {...params} size="small" label="Add a product" placeholder="Search by name or SKU" />}
            sx={{ mt: 2, maxWidth: 480 }}
          />
          <SaveBar onSave={async () => { if (await run(SAVE_RELATIONS, { productId: product.id, relations })) refetch() }} loading={loading} label="Save related products" />
        </>
      )}
    </Section>
  )
}

export default RelatedTab
