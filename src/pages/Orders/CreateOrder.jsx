/**
 * Create an order for a customer (§25.3) — e.g. after a phone call. The
 * customer confirms online (or the team records a phone confirmation when
 * that is switched on). New phone numbers become "invited" customers who
 * claim the account by verifying the same number.
 */
import { useMemo, useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Autocomplete, Box, Button, Card, CardContent, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { ArrowLeft } from 'lucide-react'

import { PageContainer, PageHeader } from '@/shared/components'
import { MoneyField, humanize } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { CUSTOMER_LOOKUP, CREATE_ORDER_FOR_CUSTOMER } from '@/services/admin.api'
import { submissionKey } from '@/services/files'
import LineEditor from './order/LineEditor'
import { toPayload } from './order/lineUtils'

const ADDRESS = ['name', 'phone', 'address', 'city', 'state', 'pincode']

const CreateOrder = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { run, loading } = useAction()
  const [lookup, { data: found, loading: searching }] = useLazyQuery(CUSTOMER_LOOKUP)
  const [customer, setCustomer] = useState(null)
  const [newCustomer, setNewCustomer] = useState({ phone: '+91', name: '' })
  const [lines, setLines] = useState([])
  const [delivery, setDelivery] = useState(0)
  const [installation, setInstallation] = useState(0)
  const [address, setAddress] = useState({})
  const [preference, setPreference] = useState('ship_together')
  const [points, setPoints] = useState(0)
  const [reason, setReason] = useState('As discussed on the phone')
  const [phoneConfirmed, setPhoneConfirmed] = useState(false)
  const [phoneReason, setPhoneReason] = useState('')
  const key = useMemo(submissionKey, [])
  const enquiryId = params.get('enquiry')

  const pick = (c) => {
    setCustomer(c)
    if (c) setAddress({ name: c.name, phone: c.phone, address: c.address || '', city: c.city || '', state: c.state || '', pincode: c.pincode || '' })
  }
  const submit = async () => {
    const input = {
      idempotency_key: key, enquiry_id: enquiryId || null, items: toPayload(lines), shipping_address: address, delivery_preference: preference,
      delivery_paise: delivery ?? 0, installation_paise: installation ?? 0, points_redeemed: Number(points) || 0, reason,
      confirmed_by_phone: phoneConfirmed, phone_confirmation_reason: phoneConfirmed ? phoneReason : null,
      ...(customer ? { customer_id: customer.id } : { customer: newCustomer }),
    }
    const order = await run(CREATE_ORDER_FOR_CUSTOMER, { input })
    if (order?.id) navigate(`/orders/${order.id}`)
  }

  return (
    <PageContainer>
      <Button component={RouterLink} to="/orders" startIcon={<ArrowLeft size={16} />} size="small" sx={{ mb: 1 }}>Orders</Button>
      <PageHeader title="New order for a customer" subtitle="The customer receives the order to confirm online. Nothing is charged." />
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Customer</Typography>
              <Autocomplete
                size="small" options={found?.customerLookup || []} loading={searching} value={customer} filterOptions={(x) => x}
                getOptionLabel={(o) => `${o.name || 'No name'} · ${o.phone}${o.city ? ` · ${o.city}` : ''}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onInputChange={(_e, v) => { if (v.length >= 3) lookup({ variables: { search: v } }) }}
                onChange={(_e, v) => pick(v)}
                renderInput={(p) => <TextField {...p} label="Find by phone or name" />}
              />
              {!customer && (
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">…or a new customer (they claim the account by verifying this number):</Typography></Grid>
                  <Grid item xs={6}><TextField size="small" fullWidth label="Phone (+91…)" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField size="small" fullWidth label="Name" value={newCustomer.name} onChange={(e) => { setNewCustomer({ ...newCustomer, name: e.target.value }); setAddress((a) => ({ ...a, name: e.target.value, phone: newCustomer.phone })) }} /></Grid>
                </Grid>
              )}
              {enquiryId && <Alert severity="info" sx={{ mt: 1.5 }}>Linked to the enquiry you came from.</Alert>}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
              <LineEditor lines={lines} onChange={setLines} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Delivery</Typography>
              <Grid container spacing={1.5}>
                {ADDRESS.map((f) => <Grid item xs={f === 'address' ? 12 : 6} key={f}><TextField size="small" fullWidth label={humanize(f)} value={address[f] || ''} onChange={(e) => setAddress({ ...address, [f]: e.target.value })} /></Grid>)}
                <Grid item xs={12}>
                  <TextField select size="small" fullWidth label="Shipping" value={preference} onChange={(e) => setPreference(e.target.value)}>
                    <MenuItem value="ship_together">Ship everything together</MenuItem>
                    <MenuItem value="ship_when_ready">Ship each item when ready</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}><MoneyField label="Delivery charge" paise={delivery} onChange={setDelivery} /></Grid>
                <Grid item xs={6}><MoneyField label="Installation" paise={installation} onChange={setInstallation} /></Grid>
                {customer && <Grid item xs={12}><TextField size="small" fullWidth type="number" label="Reward points to use" value={points} onChange={(e) => setPoints(e.target.value)} /></Grid>}
              </Grid>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <TextField size="small" multiline minRows={2} label="Message to the customer" value={reason} onChange={(e) => setReason(e.target.value)} />
                <FormControlLabel control={<Switch checked={phoneConfirmed} onChange={(e) => setPhoneConfirmed(e.target.checked)} />} label="Customer already confirmed on a recorded call" />
                {phoneConfirmed && <TextField size="small" multiline required label="When and how they confirmed" value={phoneReason} onChange={(e) => setPhoneReason(e.target.value)} helperText="Only allowed when Settings → Orders allows phone confirmation" />}
                <Box><Button variant="contained" size="large" fullWidth disabled={loading || !lines.length || (!customer && !newCustomer.phone)} onClick={submit}>Create order</Button></Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  )
}

export default CreateOrder
