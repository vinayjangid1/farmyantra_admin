/**
 * Accept a customer's order request: creates the confirmed order at the prices
 * on the request, with optional delivery/installation charges and an advance
 * payment recorded in the same step.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material'

import { humanize, MoneyField } from '@/shared/components/fy'
import { useAction } from '@/shared/hooks/useAction'
import { usePermissions } from '@/features/permissions'
import { ACCEPT_ORDER_REQUEST } from '@/services/admin.api'
import { submissionKey } from '@/services/files'
import { PAYMENT_MODES, REFERENCE_MODES } from '@/features/fulfilment/utils'
import { formatPaise } from '@/utils/money'

const today = () => new Date().toISOString().slice(0, 10)

const AcceptOrderRequestDialog = ({ enquiry, open, onClose }) => {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canRecordPayment = hasPermission('admin:payments:write')
  const { run, loading } = useAction()
  const [form, setForm] = useState({ delivery_paise: null, installation_paise: null, note: '' })
  const [withAdvance, setWithAdvance] = useState(false)
  const [advance, setAdvance] = useState({ amount_paise: null, mode: 'bank_transfer', paid_on: today(), reference: '', received_into: '', note: '' })
  const [key] = useState(submissionKey)

  const needsReference = REFERENCE_MODES.includes(advance.mode)
  const advanceReady = !withAdvance || (advance.amount_paise > 0 && advance.paid_on && (!needsReference || advance.reference.trim()))

  const accept = async () => {
    const input = {
      delivery_paise: form.delivery_paise || 0,
      installation_paise: form.installation_paise || 0,
      note: form.note.trim() || null,
      ...(withAdvance ? { advance: { ...advance, idempotency_key: key } } : {}),
    }
    const order = await run(ACCEPT_ORDER_REQUEST, { enquiryId: enquiry.id, input }, { success: 'Order created' })
    if (order?.id) navigate(`/orders/${order.id}`)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Accept order request {enquiry.enquiry_number}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Creates a confirmed order for {enquiry.contact_name} at the prices on the request ({formatPaise(enquiry.total_paise)} incl. GST).
          Stock is reserved, production jobs are created and the customer is notified.
        </Alert>
        <Grid container spacing={1.5}>
          <Grid item xs={6}><MoneyField label="Delivery charge" paise={form.delivery_paise} onChange={(v) => setForm({ ...form, delivery_paise: v })} helperText="GST added" /></Grid>
          <Grid item xs={6}><MoneyField label="Installation charge" paise={form.installation_paise} onChange={(v) => setForm({ ...form, installation_paise: v })} helperText="GST added" /></Grid>
          <Grid item xs={12}>
            <TextField size="small" fullWidth multiline minRows={2} label="Note to the customer (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Grid>
        </Grid>

        {canRecordPayment && (
          <>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel control={<Switch checked={withAdvance} onChange={(e) => setWithAdvance(e.target.checked)} />} label="Advance payment already received" />
            {withAdvance && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}><MoneyField label="Advance amount" paise={advance.amount_paise} onChange={(v) => setAdvance({ ...advance, amount_paise: v })} /></Grid>
                  <Grid item xs={6}>
                    <TextField size="small" fullWidth type="date" label="Received on" InputLabelProps={{ shrink: true }} value={advance.paid_on} onChange={(e) => setAdvance({ ...advance, paid_on: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField select size="small" fullWidth label="Mode" value={advance.mode} onChange={(e) => setAdvance({ ...advance, mode: e.target.value })}>
                      {PAYMENT_MODES.map((m) => <MenuItem key={m} value={m}>{humanize(m)}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField size="small" fullWidth required={needsReference} label="Reference (UTR / cheque no.)" value={advance.reference} onChange={(e) => setAdvance({ ...advance, reference: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField size="small" fullWidth label="Received into (our bank account)" placeholder="e.g. HDFC current a/c ••1234" value={advance.received_into} onChange={(e) => setAdvance({ ...advance, received_into: e.target.value })} />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">Recorded as an advance; the customer sees it with the balance due.</Typography>
              </Stack>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" disabled={loading || !advanceReady} onClick={accept}>Accept & create order</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AcceptOrderRequestDialog
