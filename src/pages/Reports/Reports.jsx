/**
 * Reports (§14.8): enquiry volume by type, quotation → order funnel and
 * product interest. Lightweight CSS bars keep the bundle free of a chart lib.
 */
import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Box, Card, CardContent, Grid, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'

import { ErrorState, ExportButton, PageContainer, PageHeader, StatCard } from '@/shared/components'
import { ENQUIRY_TREND, CONVERSION_FUNNEL, PRODUCT_INTEREST } from '@/services/admin.api'

const CALLBACK = '#FFE11B'
const QUOTE = '#2874F0'
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—')

const TrendChart = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.callbacks + r.quotations))
  return (
    <Box>
      <Stack direction="row" alignItems="flex-end" spacing="2px" sx={{ height: 180, borderBottom: 1, borderColor: 'divider' }}>
        {rows.map((r) => (
          <Tooltip key={r.day} title={`${String(r.day).slice(0, 10)} — ${r.callbacks} call-backs, ${r.quotations} quotation requests`}>
            <Stack sx={{ flex: 1, height: '100%', justifyContent: 'flex-end', minWidth: 3 }}>
              <Box sx={{ height: `${(r.quotations / max) * 100}%`, bgcolor: QUOTE, borderRadius: '2px 2px 0 0' }} />
              <Box sx={{ height: `${(r.callbacks / max) * 100}%`, bgcolor: CALLBACK }} />
            </Stack>
          </Tooltip>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{String(rows[0]?.day || '').slice(0, 10)}</Typography>
        <Stack direction="row" spacing={2}>
          <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, bgcolor: CALLBACK, mr: 0.5 }} />Call-back</Typography>
          <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, bgcolor: QUOTE, mr: 0.5 }} />Quotation</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">{String(rows[rows.length - 1]?.day || '').slice(0, 10)}</Typography>
      </Stack>
    </Box>
  )
}

const Funnel = ({ f }) => {
  const steps = [['Enquiries', f.enquiries], ['Quotation sent', f.quoted], ['Quotation accepted', f.accepted], ['Ordered', f.ordered]]
  return (
    <Stack spacing={1.5}>
      {steps.map(([label, value], i) => (
        <Box key={label}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
            <Typography variant="body2">{value} {i > 0 && <Typography component="span" variant="caption" color="text.secondary">({pct(value, steps[i - 1][1])} of previous)</Typography>}</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={f.enquiries ? (value / f.enquiries) * 100 : 0} sx={{ height: 10, borderRadius: 5 }} />
        </Box>
      ))}
      <Typography variant="caption" color="text.secondary">Rejected {f.rejected} · Cancelled {f.cancelled}</Typography>
    </Stack>
  )
}

const Reports = () => {
  const [days, setDays] = useState(30)
  const trend = useQuery(ENQUIRY_TREND, { variables: { days }, fetchPolicy: 'cache-and-network' })
  const funnel = useQuery(CONVERSION_FUNNEL, { variables: { days }, fetchPolicy: 'cache-and-network' })
  const interest = useQuery(PRODUCT_INTEREST, { variables: { limit: 20 }, fetchPolicy: 'cache-and-network' })
  const rows = trend.data?.enquiryTrend || []
  const f = funnel.data?.conversionFunnel
  const products = interest.data?.productInterest || []
  const totals = rows.reduce((t, r) => ({ callbacks: t.callbacks + r.callbacks, quotations: t.quotations + r.quotations }), { callbacks: 0, quotations: 0 })
  const error = trend.error || funnel.error || interest.error

  return (
    <PageContainer>
      <PageHeader title="Reports" subtitle="How customers are enquiring and how many enquiries turn into orders" />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField select size="small" label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} sx={{ minWidth: 160 }}>
          {[7, 30, 90, 180, 365].map((d) => <MenuItem key={d} value={d}>Last {d} days</MenuItem>)}
        </TextField>
      </Stack>
      {error && <ErrorState message={error.message} />}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><StatCard title="Enquiries" value={f?.enquiries ?? '—'} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Call-backs requested" value={totals.callbacks} color="warning" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Quotations requested" value={totals.quotations} color="info" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Enquiry → order" value={f ? pct(f.ordered, f.enquiries) : '—'} color="success" /></Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Enquiries per day</Typography>
            {rows.length ? <TrendChart rows={rows} /> : <Typography variant="body2" color="text.secondary">No data.</Typography>}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Conversion</Typography>
            {f ? <Funnel f={f} /> : null}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12}>
          <Card variant="outlined"><CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Product interest (all time)</Typography>
              <ExportButton rows={products} filenamePrefix="product-interest" columns={[{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Product' }, { key: 'view_count', label: 'Views' }, { key: 'enquiry_count', label: 'Enquiries' }, { key: 'ordered_units', label: 'Units ordered' }]} />
            </Stack>
            <Table size="small">
              <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Views</TableCell><TableCell align="right">Enquiries</TableCell><TableCell align="right">Enquiry rate</TableCell><TableCell align="right">Units ordered</TableCell></TableRow></TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><strong>{p.name}</strong> <Typography component="span" variant="caption" color="text.secondary">{p.sku}</Typography></TableCell>
                    <TableCell align="right">{p.view_count}</TableCell>
                    <TableCell align="right">{p.enquiry_count}</TableCell>
                    <TableCell align="right">{pct(p.enquiry_count, p.view_count)}</TableCell>
                    <TableCell align="right">{p.ordered_units}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

export default Reports
