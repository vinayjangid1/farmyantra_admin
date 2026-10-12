/**
 * Reward points (§30): the point value and every rule are editable here by
 * members with rewards:write (Super Admin by default). Changes apply to new
 * earning and redemptions; points already earned keep their count.
 */
import { useEffect, useMemo, useState } from 'react'
import { useLazyQuery, useQuery } from '@apollo/client'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, FormControlLabel, Grid, InputAdornment, MenuItem, Stack, Switch, Tab, Tabs, TextField, Typography,
} from '@mui/material'

import { CustomTable, LoadingState, PageContainer, PageHeader, SidebarPanel } from '@/shared/components'
import { StatusChip, humanize, I18nField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import {
  REWARD_SETTINGS, UPDATE_REWARD_SETTINGS, REWARD_CAMPAIGNS, SAVE_REWARD_CAMPAIGN, POINTS_REPORT, POINTS_ABUSE_SIGNALS,
  CUSTOMER_LOOKUP, CUSTOMER_POINTS, ADJUST_POINTS,
} from '@/services/admin.api'
import { submissionKey } from '@/services/files'
import { formatPaise } from '@/utils/money'
import { formatDate } from '@/utils/dateFormatter'

const NumberField = ({ label, value, onChange, suffix, helperText, disabled, step = 1 }) => (
  <TextField fullWidth size="small" type="number" label={label} value={value ?? ''} disabled={disabled} helperText={helperText} inputProps={{ step }}
    onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    InputProps={suffix ? { endAdornment: <InputAdornment position="end">{suffix}</InputAdornment> } : undefined} />
)

const SettingsTab = ({ canWrite }) => {
  const { data, loading, refetch } = useQuery(REWARD_SETTINGS, { fetchPolicy: 'cache-and-network' })
  const { run, loading: saving } = useAction()
  const [form, setForm] = useState(null)
  useEffect(() => { if (data?.rewardSettings) setForm(data.rewardSettings) }, [data])
  if (loading && !form) return <LoadingState />
  if (!form) return null
  const set = (k) => (v) => setForm({ ...form, [k]: v })
  const rupeesPerPoint = (form.point_value_paise || 0) / 100
  const exampleEarn = form.earn_rule === 'percent_of_value' ? Math.floor((100000 * (form.earn_rate_bps || 0)) / 10000 / Math.max(1, form.point_value_paise || 0)) : null
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <FormControlLabel control={<Switch checked={Boolean(form.enabled)} disabled={!canWrite} onChange={(e) => set('enabled')(e.target.checked)} />} label={form.enabled ? 'Reward points are ON' : 'Reward points are OFF'} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>Point value</Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="1 point is worth" disabled={!canWrite} inputProps={{ step: 0.01, min: 0.01 }}
                      value={rupeesPerPoint} onChange={(e) => set('point_value_paise')(Math.round(Number(e.target.value) * 100))}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} helperText={`Stored as ${form.point_value_paise} paise per point`} />
                  </Grid>
                  <Grid item xs={12} sm={6}><Typography variant="body2" color="text.secondary">100 points = {formatPaise((form.point_value_paise || 0) * 100)} off</Typography></Grid>
                </Grid>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>Earning</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Earn rule" value={form.earn_rule} disabled={!canWrite} onChange={(e) => set('earn_rule')(e.target.value)}>
                      <MenuItem value="percent_of_value">Percentage of order value</MenuItem>
                      <MenuItem value="fixed_per_product">Fixed points per product (set on each product)</MenuItem>
                    </TextField>
                  </Grid>
                  {form.earn_rule === 'percent_of_value' && (
                    <Grid item xs={12} sm={6}><NumberField label="Earn rate" suffix="%" step={0.1} disabled={!canWrite} value={(form.earn_rate_bps || 0) / 100} onChange={(v) => set('earn_rate_bps')(Math.round((v || 0) * 100))} helperText={exampleEarn !== null ? `₹1,000 order earns ${exampleEarn} points` : ''} /></Grid>
                  )}
                  <Grid item xs={6} sm={4}><NumberField label="Holding period" suffix="days" disabled={!canWrite} value={form.pending_days} onChange={set('pending_days')} helperText="After delivery" /></Grid>
                  <Grid item xs={6} sm={4}><NumberField label="Points expire after" suffix="months" disabled={!canWrite} value={form.expiry_months} onChange={set('expiry_months')} /></Grid>
                  <Grid item xs={6} sm={4}><NumberField label="Approved review bonus" suffix="pts" disabled={!canWrite} value={form.review_bonus_points} onChange={set('review_bonus_points')} /></Grid>
                  <Grid item xs={6} sm={4}><NumberField label="Referral bonus" suffix="pts" disabled={!canWrite} value={form.referral_bonus_points} onChange={set('referral_bonus_points')} /></Grid>
                </Grid>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>Using points</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={4}><NumberField label="Minimum to use" suffix="pts" disabled={!canWrite} value={form.min_redeem_points} onChange={set('min_redeem_points')} /></Grid>
                  <Grid item xs={6} sm={4}><NumberField label="Max share of an order" suffix="%" step={0.5} disabled={!canWrite} value={(form.max_redeem_percent_bps || 0) / 100} onChange={(v) => set('max_redeem_percent_bps')(Math.round((v || 0) * 100))} /></Grid>
                  <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={Boolean(form.combinable_with_offers)} disabled={!canWrite} onChange={(e) => set('combinable_with_offers')(e.target.checked)} />} label="Allowed with offers" /></Grid>
                  <Grid item xs={12} sm={6}><NumberField label="Adjustments above this need Super Admin" suffix="pts" disabled={!canWrite} value={form.super_admin_adjust_threshold} onChange={set('super_admin_adjust_threshold')} /></Grid>
                </Grid>
              </Box>
              {canWrite && <Box><Button variant="contained" disabled={saving} onClick={async () => { if (await run(UPDATE_REWARD_SETTINGS, { value: form })) refetch() }}>Save reward settings</Button></Box>}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Alert severity="info">
          Changing the point value affects new redemptions straight away. Points already in customers&apos; accounts keep their count, so their rupee value changes too — tell customers before lowering it.
          Reward points are a discount before GST; tax invoices show them as a separate line.
        </Alert>
      </Grid>
    </Grid>
  )
}

const CampaignsTab = ({ canWrite }) => {
  const { data, refetch } = useQuery(REWARD_CAMPAIGNS, { fetchPolicy: 'cache-and-network' })
  const { run, loading } = useAction()
  const [edit, setEdit] = useState(null)
  return (
    <Box>
      {canWrite && <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEdit({ name: '', kind: 'multiplier', multiplier_bps: 20000, title_i18n: { en: '' }, starts_at: '', ends_at: '', is_active: true })}>New campaign</Button>}
      <CustomTable
        tableId="reward-campaigns" rows={data?.rewardCampaigns || []} onRowClick={canWrite ? (r) => setEdit({ ...r, starts_at: String(r.starts_at).slice(0, 10), ends_at: String(r.ends_at).slice(0, 10) }) : undefined}
        columns={[
          { id: 'name', label: 'Campaign' },
          { id: 'kind', label: 'Type', format: (v, r) => (v === 'multiplier' ? `${(r.multiplier_bps || 0) / 10000}× points` : `+${r.bonus_points} points`) },
          { id: 'starts_at', label: 'From', format: (v) => formatDate(v, 'short') },
          { id: 'ends_at', label: 'To', format: (v) => formatDate(v, 'short') },
          { id: 'is_active', label: 'Status', format: (v) => <StatusChip status={v ? 'active' : 'inactive'} /> },
        ]}
      />
      <SidebarPanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? 'Edit campaign' : 'New campaign'} loading={loading}
        onSave={async () => { if (await run(SAVE_REWARD_CAMPAIGN, { id: edit.id || null, input: edit })) { setEdit(null); refetch() } }}>
        {edit && (
          <Stack spacing={2}>
            <TextField size="small" label="Internal name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <I18nField label="Title shown to customers" value={edit.title_i18n} onChange={(v) => setEdit({ ...edit, title_i18n: v })} />
            <TextField select size="small" label="Type" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value })}>
              <MenuItem value="multiplier">Multiply points</MenuItem>
              <MenuItem value="fixed_bonus">Fixed bonus per order</MenuItem>
            </TextField>
            {edit.kind === 'multiplier'
              ? <NumberField label="Multiplier" suffix="×" step={0.5} value={(edit.multiplier_bps || 0) / 10000} onChange={(v) => setEdit({ ...edit, multiplier_bps: Math.round((v || 0) * 10000) })} />
              : <NumberField label="Bonus points" value={edit.bonus_points} onChange={(v) => setEdit({ ...edit, bonus_points: v })} />}
            <Grid container spacing={1.5}>
              <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Starts" InputLabelProps={{ shrink: true }} value={edit.starts_at} onChange={(e) => setEdit({ ...edit, starts_at: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" type="date" label="Ends" InputLabelProps={{ shrink: true }} value={edit.ends_at} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value })} /></Grid>
            </Grid>
            <FormControlLabel control={<Switch checked={edit.is_active !== false} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />} label="Active" />
          </Stack>
        )}
      </SidebarPanel>
    </Box>
  )
}

const CustomerTab = ({ canWrite }) => {
  const [lookup, { data: found }] = useLazyQuery(CUSTOMER_LOOKUP)
  const [customer, setCustomer] = useState(null)
  const { data, refetch } = useQuery(CUSTOMER_POINTS, { variables: { customerId: customer?.id }, skip: !customer, fetchPolicy: 'network-only' })
  const { run, loading } = useAction()
  const [adj, setAdj] = useState({ points: '', reason: '' })
  const key = useMemo(submissionKey, [customer, data])
  const acc = data?.customerPoints?.account
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Autocomplete size="small" options={found?.customerLookup || []} value={customer} filterOptions={(x) => x}
          getOptionLabel={(o) => `${o.name || 'No name'} · ${o.phone}`} isOptionEqualToValue={(a, b) => a.id === b.id}
          onInputChange={(_e, v) => { if (v.length >= 3) lookup({ variables: { search: v } }) }} onChange={(_e, v) => setCustomer(v)}
          renderInput={(p) => <TextField {...p} label="Customer (phone or name)" />} />
        {acc && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Grid container spacing={1}>
                {['available', 'pending', 'reserved', 'lifetime_earned'].map((k) => (
                  <Grid item xs={6} key={k}><Typography variant="caption" color="text.secondary">{humanize(k)}</Typography><Typography variant="h6">{acc[k]}</Typography></Grid>
                ))}
              </Grid>
              {canWrite && (
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Adjust balance</Typography>
                  <TextField size="small" type="number" label="Points (negative to deduct)" value={adj.points} onChange={(e) => setAdj({ ...adj, points: e.target.value })} />
                  <TextField size="small" label="Reason (required)" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} />
                  <Button variant="contained" disabled={loading || !adj.reason.trim() || !Number(adj.points)} onClick={async () => {
                    if (await run(ADJUST_POINTS, { customerId: customer.id, points: Number(adj.points), reason: adj.reason, idempotencyKey: key })) { setAdj({ points: '', reason: '' }); refetch() }
                  }}>Save adjustment</Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>
      <Grid item xs={12} md={7}>
        {data && (
          <CustomTable tableId="points-ledger" rows={data.customerPoints.ledger} columns={[
            { id: 'created_at', label: 'When', format: (v) => formatDate(v, 'short') },
            { id: 'entry_type', label: 'Entry', format: (v) => humanize(v) },
            { id: 'points', label: 'Points', align: 'right', format: (v) => (v > 0 ? `+${v}` : v) },
            { id: 'balance_after', label: 'Balance', align: 'right' },
            { id: 'reason', label: 'Reason' },
          ]} />
        )}
      </Grid>
    </Grid>
  )
}

const ReportTab = () => {
  const { data } = useQuery(POINTS_REPORT, { fetchPolicy: 'cache-and-network' })
  const { data: abuse } = useQuery(POINTS_ABUSE_SIGNALS, { fetchPolicy: 'cache-and-network' })
  const r = data?.pointsReport
  if (!r) return <LoadingState />
  const tiles = [['Issued', r.issued], ['Redeemed', r.redeemed], ['Expired', r.expired], ['Adjusted', r.adjusted], ['Outstanding', r.outstanding_points], ['Customers', r.accounts]]
  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {tiles.map(([k, v]) => (
          <Grid item xs={6} md={2} key={k}><Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="h5" sx={{ fontWeight: 800 }}>{v}</Typography></CardContent></Card></Grid>
        ))}
      </Grid>
      <Alert severity="info" sx={{ mb: 2 }}>Outstanding liability at today&apos;s point value ({formatPaise(r.point_value_paise)}/point): <strong>{formatPaise(r.liability_paise)}</strong></Alert>
      {abuse?.pointsAbuseSignals && (
        <Grid container spacing={2}>
          {Object.entries(abuse.pointsAbuseSignals).map(([k, rows]) => (
            <Grid item xs={12} md={6} key={k}>
              <Card variant="outlined"><CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{humanize(k)} ({rows.length})</Typography>
                {rows.slice(0, 10).map((x) => <Typography key={x.id || x.customer_id} variant="body2">{x.name || x.referrer_name} {x.phone ? `· ${x.phone}` : ''} {x.points ? `· ${x.points} pts` : ''} {x.reversed_orders ? `· ${x.reversed_orders} reversed` : ''}</Typography>)}
                {!rows.length && <Typography variant="body2" color="text.secondary">Nothing to review.</Typography>}
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

const Rewards = () => {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('admin:rewards:write')
  const [tab, setTab] = useState('settings')
  return (
    <PageContainer>
      <PageHeader title="Reward points" subtitle="Point value, earning and redemption rules, campaigns and customer balances." />
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
        <Tab value="settings" label="Settings & point value" />
        <Tab value="campaigns" label="Campaigns" />
        <Tab value="customers" label="Customer balances" />
        <Tab value="report" label="Report & review" />
      </Tabs>
      {tab === 'settings' && <SettingsTab canWrite={canWrite} />}
      {tab === 'campaigns' && <CampaignsTab canWrite={canWrite} />}
      {tab === 'customers' && <CustomerTab canWrite={canWrite} />}
      {tab === 'report' && <ReportTab />}
    </PageContainer>
  )
}

export default Rewards
